/**
 * ファイル名: timeline.service.ts
 *
 * 【概要】
 * タイムライン取得のビジネスロジック
 * つながりリストベースのRLSフィルタリングとページネーションを実装
 *
 * 【依存関係】
 * - @supabase/supabase-js: データベースアクセス
 * - lib/supabase/types.ts: 型定義
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Event = Database['public']['Tables']['events']['Row']

/**
 * タイムライン取得パラメータ
 */
export type FetchTimelineParams = {
  /** ページ番号（0始まり） */
  page?: number
  /** 1ページあたりの件数（デフォルト: 20） */
  limit?: number
}

/**
 * タイムライン取得結果
 */
export type FetchTimelineResult = {
  /** イベント一覧 */
  data: Event[]
  /** エラーコード */
  error: string | null
  /** 次のページが存在するか */
  hasMore: boolean
}

/**
 * タイムラインイベントを取得
 *
 * @param supabase - Supabaseクライアント
 * @param params - ページネーションパラメータ
 * @returns イベント一覧とページング情報
 *
 * 【処理内容】
 * 1. 現在ユーザーを取得
 * 2. つながりリストベースでRLSフィルタリング
 * 3. status='recruiting'のイベントのみ取得
 * 4. created_at DESCで並び順
 * 5. ページネーション適用
 */
export async function fetchTimeline(
  supabase: SupabaseClient<Database>,
  params: FetchTimelineParams = {}
): Promise<FetchTimelineResult> {
  const { page = 0, limit = 20 } = params

  // 【環境変数による認証スキップ制御】
  // NEXT_PUBLIC_SKIP_AUTH=true の場合のみ認証をスキップ（開発専用）
  // TODO: User Story 4実装後にNEXT_PUBLIC_SKIP_AUTHを削除 - specs/001-event-creation/refactor-tasks.md参照
  const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'

  if (!SKIP_AUTH) {
    // 【ステップ1】現在ユーザーを取得（本番環境）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        data: [],
        error: 'UNAUTHORIZED',
        hasMore: false,
      }
    }
  }

  // 【ステップ2】ページネーション範囲を計算
  const from = page * limit
  const to = from + limit - 1

  // 【ステップ3】イベントを取得
  // RLSポリシーによってつながりリストベースでフィルタリングされる
  const { data: events, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'recruiting')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (fetchError) {
    console.error('タイムライン取得エラー:', fetchError)
    return {
      data: [],
      error: 'FETCH_ERROR',
      hasMore: false,
    }
  }

  // 【ステップ4】次のページが存在するか判定
  // limit件取得できた場合、次のページが存在する可能性がある
  const hasMore = events.length === limit

  return {
    data: events,
    error: null,
    hasMore,
  }
}
