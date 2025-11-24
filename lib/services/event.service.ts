/**
 * ファイル名: event.service.ts
 *
 * 【概要】
 * イベント作成・編集・削除のビジネスロジック
 * Supabase PostgreSQLとの連携、匿名ID生成、投稿上限チェックを担当
 *
 * 【処理フロー】
 * 1. イベント作成リクエストを受け取る
 * 2. バリデーション（Zodスキーマ）
 * 3. 1日3件投稿上限チェック（カテゴリ別）
 * 4. 匿名ID自動生成
 * 5. データベースに保存
 * 6. 統一形式のレスポンスを返す
 *
 * 【主要機能】
 * - イベント作成（createEvent）
 * - 1日3件投稿上限チェック（checkDailyPostLimit）
 * - 匿名ID自動割り当て（assignAnonymousId）
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Component Client
 * - @/lib/validation/event.schema: Zodバリデーションスキーマ
 * - @/lib/utils/generateAnonId: 匿名ID生成ユーティリティ
 * - spec.md FR-001, FR-009: 匿名投稿機能
 */

import { createClient } from "@/lib/supabase/server";
import { createEventSchema, type CreateEventInput } from "@/lib/validation/event.schema";
import { generateAnonId } from "@/lib/utils/generateAnonId";

/**
 * API統一レスポンス型（Discriminated Union）
 *
 * 【用途】すべてのAPI関数の戻り値型
 * 【設計根拠】spec.md NFR-003: 統一されたエラーハンドリング
 *
 * 【成功時】
 * { success: true, message: '成功メッセージ', code: 'SUCCESS', data: ... }
 *
 * 【エラー時】
 * { success: false, message: 'エラーメッセージ', code: 'ERROR_CODE' }
 *
 * 【Discriminated Unionの利点】
 * - success === true の場合、dataは必ず存在する（型安全性）
 * - success === false の場合、dataは存在しない（型安全性）
 * - TypeScriptコンパイラが自動的に型を絞り込む
 */
export type ApiResponse<T = unknown> =
  | {
      success: true;
      message: string;
      code: string;
      data: T;
    }
  | {
      success: false;
      message: string;
      code: string;
    };

/**
 * イベント作成結果型
 */
export type CreateEventResult = {
  id: string;
  anon_id: string;
  category: string;
  title: string;
  date_start: string;
  date_end: string;
};

/**
 * 1日の投稿上限チェック
 *
 * @param userId - ユーザーID
 * @param category - イベントカテゴリ
 * @returns 投稿可能な場合はtrue、上限到達の場合はfalse
 *
 * 【処理内容】
 * 1. Supabaseで当日のユーザーの該当カテゴリ投稿数をカウント
 * 2. 3件未満の場合はtrue、3件以上の場合はfalseを返す
 *
 * 【使用例】
 * const canPost = await checkDailyPostLimit('user-id-123', 'drinking')
 * if (!canPost) {
 *   return { success: false, message: '1日の投稿上限（3件）に達しました', code: 'DAILY_LIMIT_EXCEEDED' }
 * }
 *
 * 【設計根拠】
 * spec.md FR-010: 1日あたりカテゴリ別投稿上限3件
 *
 * 【注意】
 * - 投稿上限はカテゴリ別（飲みで3件、旅行で3件はOK）
 * - 日付は UTC ではなく JST (Asia/Tokyo) で判定
 */
export async function checkDailyPostLimit(userId: string, category: string): Promise<boolean> {
  const supabase = createClient();

  // 【データ取得】今日の0時〜23:59:59のイベント数をカウント
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 今日の0時
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // 明日の0時

  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true }) // headオプションでデータ取得せずカウントのみ
    .eq("host_id", userId)
    .eq("category", category)
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString());

  // 【エラーハンドリング】データベースエラー時は念のため投稿不可とする
  if (error) {
    console.error("投稿上限チェックエラー:", error);
    return false;
  }

  // 【上限チェック】3件未満の場合は投稿可能
  return (count ?? 0) < 3;
}

/**
 * 匿名ID自動割り当て
 *
 * @param userId - ユーザーID
 * @param category - イベントカテゴリ
 * @returns 匿名ID（例: '🍶A', '✈️B'）
 *
 * 【処理内容】
 * 1. Supabaseで当日のユーザーの該当カテゴリ投稿数をカウント
 * 2. generateAnonId関数で匿名IDを生成
 *
 * 【使用例】
 * const anonId = await assignAnonymousId('user-id-123', 'drinking')
 * // => '🍶A' (その日の飲みカテゴリ1件目)
 *
 * 【設計根拠】
 * spec.md FR-009: 匿名ID表示（🍶A形式）
 *
 * 【注意】
 * - 削除されたイベントは連番に影響しない（歯抜けになる可能性あり）
 * - カテゴリ別に連番管理（飲みAと旅行Aは別カウント）
 */
export async function assignAnonymousId(userId: string, category: string): Promise<string> {
  const supabase = createClient();

  // 【データ取得】今日の0時〜23:59:59のイベント数をカウント
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("host_id", userId)
    .eq("category", category)
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString());

  // 【エラーハンドリング】エラー時は0件として扱う（フェイルセーフ）
  const dailyPostCount = error ? 0 : (count ?? 0);

  // 【匿名ID生成】generateAnonId関数を使用
  return generateAnonId(category, dailyPostCount);
}

/**
 * イベント作成
 *
 * @param input - イベント作成データ
 * @param userId - ログインユーザーID
 * @returns API統一レスポンス（成功時はイベントデータを含む）
 *
 * 【処理内容】
 * 1. バリデーション（Zodスキーマ）
 * 2. 1日3件投稿上限チェック
 * 3. 匿名ID自動割り当て
 * 4. データベースに保存
 * 5. 統一形式のレスポンスを返す
 *
 * 【使用例】
 * const result = await createEvent({
 *   title: '軽く飲みませんか？',
 *   category: 'drinking',
 *   date_start: '2025-12-01T19:00:00+09:00',
 *   date_end: '2025-12-01T22:00:00+09:00',
 *   capacity_min: 3,
 *   capacity_max: 5,
 *   price_min: 3000,
 *   price_max: 5000,
 *   comment: '仕事終わりに軽く一杯どうですか？'
 * }, 'user-id-123')
 *
 * if (result.success) {
 *   console.log('イベント作成成功:', result.data)
 * } else {
 *   console.error('エラー:', result.message)
 * }
 *
 * 【設計根拠】
 * spec.md FR-001: 匿名イベント投稿
 * spec.md NFR-003: 統一されたエラーハンドリング
 *
 * 【エラーコード】
 * - VALIDATION_ERROR: バリデーションエラー
 * - DAILY_LIMIT_EXCEEDED: 1日の投稿上限超過
 * - DATABASE_ERROR: データベースエラー
 */
export async function createEvent(
  input: CreateEventInput,
  userId: string
): Promise<ApiResponse<CreateEventResult>> {
  // 【ステップ1】バリデーション（Zodスキーマ）
  const validation = createEventSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "バリデーションエラー",
      code: "VALIDATION_ERROR",
    };
  }

  const validData = validation.data;

  // 【ステップ2】1日3件投稿上限チェック
  const canPost = await checkDailyPostLimit(userId, validData.category);
  if (!canPost) {
    return {
      success: false,
      message: "1日の投稿上限（3件）に達しました。明日以降に再度お試しください。",
      code: "DAILY_LIMIT_EXCEEDED",
    };
  }

  // 【ステップ3】匿名ID自動割り当て
  const anonId = await assignAnonymousId(userId, validData.category);

  // 【ステップ4】データベースに保存
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: validData.title,
      category: validData.category,
      anon_id: anonId,
      date_start: validData.date_start,
      date_end: validData.date_end,
      capacity_min: validData.capacity_min,
      capacity_max: validData.capacity_max,
      price_min: validData.price_min ?? null,
      price_max: validData.price_max ?? null,
      comment: validData.comment ?? null,
      deadline: validData.deadline ?? null,
      host_id: userId,
      status: "recruiting", // デフォルトは募集中
    })
    .select("id, anon_id, category, title, date_start, date_end")
    .single();

  // 【エラーハンドリング】データベースエラー
  if (error) {
    console.error("イベント作成エラー:", error);
    return {
      success: false,
      message: "イベントの作成に失敗しました。もう一度お試しください。",
      code: "DATABASE_ERROR",
    };
  }

  // 【ステップ5】成功レスポンスを返す

  return {
    success: true,
    message: "イベントを作成しました",
    code: "EVENT_CREATED",
    data,
  };
}

/**
 * イベント更新
 *
 * @param eventId - 更新対象のイベントID
 * @param input - 更新データ
 * @param userId - 実行ユーザーID
 * @returns API統一レスポンス
 *
 * 【処理内容】
 * 1. バリデーション
 * 2. 権限チェック（幹事のみ）
 * 3. ステータスチェック（募集中のみ編集可など）
 * 4. 更新実行
 */
export async function updateEvent(
  eventId: string,
  input: CreateEventInput, // UpdateEventInputと同じ
  userId: string
): Promise<ApiResponse<null>> {
  // 【ステップ1】バリデーション
  const validation = createEventSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "バリデーションエラー",
      code: "VALIDATION_ERROR",
    };
  }
  const validData = validation.data;

  const supabase = createClient();

  // 【ステップ2・3】イベント取得と権限・ステータスチェック
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("host_id, status")
    .eq("id", eventId)
    .single();

  if (fetchError || !event) {
    return {
      success: false,
      message: "イベントが見つかりません",
      code: "EVENT_NOT_FOUND",
    };
  }

  if (event.host_id !== userId) {
    return {
      success: false,
      message: "編集権限がありません",
      code: "FORBIDDEN",
    };
  }

  // キャンセル済みのイベントは編集不可にするなどのルールがあればここに追加
  if (event.status === "cancelled") {
    return {
      success: false,
      message: "中止されたイベントは編集できません",
      code: "EVENT_CANCELLED",
    };
  }

  // 【ステップ4】更新実行
  const { error: updateError } = await supabase
    .from("events")
    .update({
      title: validData.title,
      category: validData.category,
      date_start: validData.date_start,
      date_end: validData.date_end,
      capacity_min: validData.capacity_min,
      capacity_max: validData.capacity_max,
      price_min: validData.price_min ?? null,
      price_max: validData.price_max ?? null,
      comment: validData.comment ?? null,
      deadline: validData.deadline ?? null,
    })
    .eq("id", eventId);

  if (updateError) {
    console.error("イベント更新エラー:", updateError);
    return {
      success: false,
      message: "イベントの更新に失敗しました",
      code: "DATABASE_ERROR",
    };
  }

  return {
    success: true,
    message: "イベントを更新しました",
    code: "EVENT_UPDATED",
    data: null,
  };
}

/**
 * イベント中止（キャンセル）
 *
 * @param eventId - 対象イベントID
 * @param userId - 実行ユーザーID
 * @returns API統一レスポンス
 */
export async function cancelEvent(eventId: string, userId: string): Promise<ApiResponse<null>> {
  const supabase = createClient();

  // 権限チェック
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("host_id, status")
    .eq("id", eventId)
    .single();

  if (fetchError || !event) {
    return {
      success: false,
      message: "イベントが見つかりません",
      code: "EVENT_NOT_FOUND",
    };
  }

  if (event.host_id !== userId) {
    return {
      success: false,
      message: "権限がありません",
      code: "FORBIDDEN",
    };
  }

  if (event.status === "cancelled") {
    return {
      success: false,
      message: "すでに中止されています",
      code: "ALREADY_CANCELLED",
    };
  }

  // ステータス更新
  const { error: updateError } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId)
    .eq("host_id", userId);

  if (updateError) {
    console.error("イベント中止エラー:", updateError);
    return {
      success: false,
      message: "イベントの中止に失敗しました",
      code: "DATABASE_ERROR",
    };
  }

  return {
    success: true,
    message: "イベントを中止しました",
    code: "EVENT_CANCELLED",
    data: null,
  };
}
