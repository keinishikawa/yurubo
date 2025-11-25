/**
 * ファイル名: connection.service.ts
 *
 * 【概要】
 * つながりリスト操作のビジネスロジック
 * つながり数のカウントなどを提供
 *
 * 【依存関係】
 * - @supabase/supabase-js: データベースアクセス
 * - lib/supabase/types.ts: 型定義
 *
 * @see specs/001-event-creation/spec.md FR-019: つながりリスト未設定時の警告表示
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * つながりリスト数取得結果（Discriminated Union）
 */
export type GetConnectionCountResult =
  | {
      /** つながり数 */
      count: number
      /** エラーなし */
      error: null
    }
  | {
      /** カウント不可 */
      count: 0
      /** エラーコード */
      error: 'UNAUTHORIZED' | 'FETCH_ERROR'
    }

/**
 * 現在ユーザーのつながりリスト数を取得
 *
 * @param supabase - Supabaseクライアント
 * @returns つながり数とエラー情報
 *
 * 【処理内容】
 * 1. 現在ユーザーを取得
 * 2. connectionsテーブルからuser_idが一致するレコード数をカウント
 *
 * 【設計根拠】
 * spec.md FR-019: つながりリストが空の場合に警告を表示するための判定用
 */
export async function getConnectionCount(
  supabase: SupabaseClient<Database>
): Promise<GetConnectionCountResult> {
  // 【ステップ1】現在ユーザーを取得
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      count: 0,
      error: 'UNAUTHORIZED',
    }
  }

  // 【ステップ2】つながり数をカウント
  const { count, error: fetchError } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (fetchError) {
    console.error('つながり数取得エラー:', fetchError)
    return {
      count: 0,
      error: 'FETCH_ERROR',
    }
  }

  return {
    count: count ?? 0,
    error: null,
  }
}
