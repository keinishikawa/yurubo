/**
 * ファイル名: createEvent.ts
 *
 * 【概要】
 * イベント作成のServer Action
 * クライアントコンポーネントから呼び出され、サーバーサイドでイベント作成処理を実行
 *
 * 【処理フロー】
 * 1. 'use server'ディレクティブでサーバーサイド実行を保証
 * 2. 現在ログイン中のユーザーIDをSupabase認証から取得
 * 3. イベントサービスのcreateEvent()を呼び出し
 * 4. 結果をクライアントに返却
 *
 * 【主要機能】
 * - Server Actionとしてのイベント作成エンドポイント
 * - 認証状態チェック
 * - エラーハンドリング
 *
 * 【依存関係】
 * - @/lib/services/event.service: イベント作成ビジネスロジック
 * - @/lib/supabase/server: Supabase Server Client
 * - @/lib/validation/event.schema: 入力型定義
 * - spec.md FR-001: 匿名イベント投稿
 */

"use server";

import { createEvent as createEventService } from "@/lib/services/event.service";
import type { CreateEventInput } from "@/lib/validation/event.schema";
import type { ApiResponse, CreateEventResult } from "@/lib/services/event.service";

/**
 * イベント作成Server Action
 *
 * @param input - イベント作成データ
 * @returns API統一レスポンス（成功時はイベントデータを含む）
 *
 * 【処理内容】
 * 1. Supabase認証から現在のユーザーIDを取得
 * 2. 未ログインの場合はエラーを返す
 * 3. イベントサービスのcreateEvent()を呼び出し
 * 4. 結果をそのまま返却
 *
 * 【使用例】
 * // クライアントコンポーネントから呼び出し
 * import { createEvent } from '@/app/actions/createEvent'
 *
 * const handleSubmit = async (data: CreateEventInput) => {
 *   const result = await createEvent(data)
 *   if (result.success) {
 *     toast.success(result.message)
 *   } else {
 *     toast.error(result.message)
 *   }
 * }
 *
 * 【設計根拠】
 * spec.md FR-001: 匿名イベント投稿機能
 * Next.js 15 Server Actions: クライアントから直接呼び出し可能なサーバー関数
 *
 * 【エラーコード】
 * - UNAUTHORIZED: 未ログイン
 * - VALIDATION_ERROR: バリデーションエラー（event.serviceから）
 * - DAILY_LIMIT_EXCEEDED: 1日の投稿上限超過（event.serviceから）
 * - DATABASE_ERROR: データベースエラー（event.serviceから）
 */
export async function createEvent(
  input: CreateEventInput
): Promise<ApiResponse<CreateEventResult>> {
  // 【ステップ1】Supabase認証から現在のユーザーを取得 (T165)
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 【エラーハンドリング】未ログインの場合
  if (authError || !user) {
    return {
      success: false,
      message: "ログインが必要です。ログインしてから再度お試しください。",
      code: "UNAUTHORIZED",
    };
  }

  const userId = user.id;

  // 【ステップ2】イベント作成サービスを呼び出し
  // バリデーション、投稿上限チェック、匿名ID割り当て、DB保存を実行
  const result = await createEventService(input, userId);

  // 【ステップ3】結果をクライアントに返却
  return result;
}
