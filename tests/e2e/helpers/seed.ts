/**
 * ファイル名: seed.ts
 *
 * 【概要】
 * E2Eテスト用シードヘルパー
 * Supabase Admin API（service_role_key）を使用してテストデータを作成
 *
 * 【主要機能】
 * - テストユーザー作成（auth.usersとusersテーブル両方）
 * - つながりデータ作成（双方向）
 * - つながりリクエスト作成
 * - テストデータクリーンアップ
 *
 * 【依存関係】
 * - @supabase/supabase-js: Supabase Admin Client
 * - 環境変数: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * @see Issue #55 - E2Eテスト用シードヘルパーの実装
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../lib/supabase/types";

/**
 * E2Eテストで作成したデータを追跡するためのセット
 * クリーンアップ時に使用
 */
const createdUserIds: Set<string> = new Set();

/**
 * Supabase Admin Clientを取得
 *
 * @returns service_role_keyを使用したSupabase Admin Client
 *
 * 【注意】
 * - SUPABASE_SERVICE_ROLE_KEYはRLSをバイパスする強力な権限を持つ
 * - テスト環境（ローカルSupabase）でのみ使用
 * - 本番環境では絶対に使用しない
 */
function getAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "E2Eシードヘルパー: NEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが必要です"
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * テストユーザーの型定義
 */
export interface TestUser {
  id: string;
  email: string;
  displayName: string;
}

/**
 * カテゴリフラグの型定義
 */
export interface CategoryFlags {
  drinking?: boolean;
  travel?: boolean;
  tennis?: boolean;
  other?: boolean;
}

/**
 * テストユーザーを作成
 *
 * @param displayName - 表示名
 * @param options - オプション（メールアドレス、カテゴリ設定など）
 * @returns 作成されたユーザー情報
 *
 * 【処理内容】
 * 1. auth.usersにユーザーを作成（Admin API使用）
 * 2. usersテーブルにプロフィールを作成
 * 3. 作成したユーザーIDを追跡リストに追加
 *
 * 【使用例】
 * const userA = await createTestUser('ユーザーA')
 * const userB = await createTestUser('ユーザーB', {
 *   email: 'custom@example.com',
 *   enabledCategories: ['drinking', 'travel']
 * })
 */
export async function createTestUser(
  displayName: string,
  options?: {
    email?: string;
    enabledCategories?: string[];
  }
): Promise<TestUser> {
  const adminClient = getAdminClient();

  // ユニークなメールアドレスを生成
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const email = options?.email || `e2e-test-${timestamp}-${randomSuffix}@example.com`;

  // 1. auth.usersにユーザーを作成
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true, // メール確認済みとしてマーク
    user_metadata: {
      display_name: displayName,
    },
  });

  if (authError || !authData.user) {
    throw new Error(`テストユーザー作成エラー（auth）: ${authError?.message || "不明なエラー"}`);
  }

  const userId = authData.user.id;

  // 2. usersテーブルにプロフィールを作成
  const { error: profileError } = await adminClient.from("users").insert({
    id: userId,
    display_name: displayName,
    enabled_categories: options?.enabledCategories || ["drinking", "travel", "tennis", "other"],
  });

  if (profileError) {
    // auth.usersは作成済みなのでロールバック
    await adminClient.auth.admin.deleteUser(userId);
    throw new Error(`テストユーザー作成エラー（profile）: ${profileError.message}`);
  }

  // 3. クリーンアップ用にIDを追跡
  createdUserIds.add(userId);

  return {
    id: userId,
    email,
    displayName,
  };
}

/**
 * つながりを作成（双方向）
 *
 * @param userAId - ユーザーAのID
 * @param userBId - ユーザーBのID
 * @param categoryFlags - カテゴリフラグ（省略時は全てfalse）
 *
 * 【処理内容】
 * - 双方向のつながりレコードを作成（A→B、B→A）
 * - RLSをバイパスしてAdmin APIで直接INSERT
 *
 * 【使用例】
 * // 飲みカテゴリのみOKのつながりを作成
 * await seedConnection(userA.id, userB.id, { drinking: true })
 *
 * // 全カテゴリOKのつながりを作成
 * await seedConnection(userA.id, userB.id, {
 *   drinking: true,
 *   travel: true,
 *   tennis: true,
 *   other: true
 * })
 */
export async function seedConnection(
  userAId: string,
  userBId: string,
  categoryFlags: CategoryFlags = {}
): Promise<void> {
  const adminClient = getAdminClient();

  // デフォルト値を設定（未指定はfalse）
  const flags = {
    drinking: categoryFlags.drinking ?? false,
    travel: categoryFlags.travel ?? false,
    tennis: categoryFlags.tennis ?? false,
    other: categoryFlags.other ?? false,
  };

  // 双方向レコードを作成
  const { error } = await adminClient.from("connections").insert([
    {
      user_id: userAId,
      target_id: userBId,
      category_flags: flags,
    },
    {
      user_id: userBId,
      target_id: userAId,
      category_flags: flags,
    },
  ]);

  if (error) {
    throw new Error(`つながり作成エラー: ${error.message}`);
  }
}

/**
 * つながりリクエストを作成
 *
 * @param senderId - 送信者のユーザーID
 * @param receiverId - 受信者のユーザーID
 * @param options - オプション（メッセージ、有効期限など）
 * @returns 作成されたリクエストのID
 *
 * 【処理内容】
 * - connection_requestsテーブルにレコードを作成
 * - RLSをバイパスしてAdmin APIで直接INSERT
 *
 * 【使用例】
 * const requestId = await seedConnectionRequest(userA.id, userB.id, {
 *   message: 'つながりましょう！'
 * })
 */
export async function seedConnectionRequest(
  senderId: string,
  receiverId: string,
  options?: {
    message?: string;
  }
): Promise<string> {
  const adminClient = getAdminClient();

  const { data, error } = await adminClient
    .from("connection_requests")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      message: options?.message || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`つながりリクエスト作成エラー: ${error?.message || "不明なエラー"}`);
  }

  return data.id;
}

/**
 * テストデータをクリーンアップ
 *
 * 【処理内容】
 * - createdUserIdsに追跡されている全ユーザーを削除
 * - auth.usersの削除により、ON DELETE CASCADEで関連データも削除される
 *   - users（プロフィール）
 *   - connections（つながり）
 *   - connection_requests（リクエスト）
 *   - events（イベント）
 *
 * 【使用例】
 * test.afterAll(async () => {
 *   await cleanupTestData()
 * })
 */
export async function cleanupTestData(): Promise<void> {
  const adminClient = getAdminClient();

  // 追跡されているユーザーを全て削除
  for (const userId of createdUserIds) {
    try {
      await adminClient.auth.admin.deleteUser(userId);
    } catch (error) {
      // 既に削除されている場合は無視
      console.warn(`ユーザー削除スキップ（${userId}）:`, error);
    }
  }

  // 追跡リストをクリア
  createdUserIds.clear();
}

/**
 * 特定のメールプレフィックスを持つテストユーザーを一括削除
 *
 * @param emailPrefix - メールアドレスのプレフィックス（デフォルト: 'e2e-test-'）
 *
 * 【処理内容】
 * - 指定されたプレフィックスで始まるメールアドレスのユーザーを検索
 * - 見つかったユーザーを全て削除
 *
 * 【使用例】
 * // テスト開始前に古いテストデータをクリーンアップ
 * await cleanupTestUsersByEmailPrefix('e2e-test-')
 */
export async function cleanupTestUsersByEmailPrefix(
  emailPrefix: string = "e2e-test-"
): Promise<void> {
  const adminClient = getAdminClient();

  // auth.usersからテストユーザーを検索
  // Note: admin.listUsers()はページネーションがあるため、
  // 大量のユーザーがいる場合は繰り返し呼び出す必要がある
  const { data, error } = await adminClient.auth.admin.listUsers({
    perPage: 1000, // 最大値
  });

  if (error) {
    console.error("テストユーザー一覧取得エラー:", error);
    return;
  }

  // プレフィックスに一致するユーザーを削除
  const testUsers = data.users.filter((user) => user.email?.startsWith(emailPrefix));

  for (const user of testUsers) {
    try {
      await adminClient.auth.admin.deleteUser(user.id);
    } catch (deleteError) {
      console.warn(`ユーザー削除スキップ（${user.id}）:`, deleteError);
    }
  }
}

/**
 * 匿名IDを生成
 *
 * @param category - カテゴリ名（'drinking', 'travel', 'tennis', 'other'）
 * @returns 匿名ID（例: '🍶A', '✈️B'）
 */
function generateAnonId(category: string): string {
  const emojiMap: Record<string, string> = {
    drinking: "🍶",
    travel: "✈️",
    tennis: "🎾",
    other: "📌",
  };
  const emoji = emojiMap[category] || "📌";
  // ランダムな大文字アルファベット
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${emoji}${letter}`;
}

/**
 * イベントを作成
 *
 * @param hostId - 投稿者のユーザーID
 * @param options - イベントオプション
 * @returns 作成されたイベントのID
 *
 * 【処理内容】
 * - eventsテーブルにレコードを作成
 * - RLSをバイパスしてAdmin APIで直接INSERT
 *
 * 【使用例】
 * const eventId = await seedEvent(userA.id, {
 *   category: 'drinking',
 *   title: 'テスト飲み会',
 *   comment: 'テスト用イベント'
 * })
 */
export async function seedEvent(
  hostId: string,
  options?: {
    category?: string;
    title?: string;
    comment?: string;
    dateStart?: string;
    dateEnd?: string;
    capacityMin?: number;
    capacityMax?: number;
    priceMin?: number;
    priceMax?: number;
  }
): Promise<string> {
  const adminClient = getAdminClient();

  // デフォルト値を設定
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const category = options?.category || "drinking";

  const { data, error } = await adminClient
    .from("events")
    .insert({
      host_id: hostId,
      category: category,
      title: options?.title || "テストイベント",
      comment: options?.comment || null,
      date_start: options?.dateStart || tomorrowStr,
      date_end: options?.dateEnd || tomorrowStr,
      capacity_min: options?.capacityMin || 2,
      capacity_max: options?.capacityMax || 5,
      price_min: options?.priceMin || null,
      price_max: options?.priceMax || null,
      anon_id: generateAnonId(category),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`イベント作成エラー: ${error?.message || "不明なエラー"}`);
  }

  return data.id;
}
