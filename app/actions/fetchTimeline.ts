/**
 * ファイル名: fetchTimeline.ts
 *
 * 【概要】
 * タイムライン取得のServer Action
 *
 * 【依存関係】
 * - Next.js Server Actions
 * - lib/services/timeline.service.ts: ビジネスロジック
 * - lib/supabase/server.ts: サーバーサイドSupabaseクライアント
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchTimeline as fetchTimelineService } from '@/lib/services/timeline.service'
import type { FetchTimelineParams } from '@/lib/services/timeline.service'
import type { Database } from '@/lib/supabase/types'

type Event = Database['public']['Tables']['events']['Row']

/**
 * Server Actionレスポンス型
 */
export type FetchTimelineResponse = {
  success: boolean
  data?: Event[]
  hasMore?: boolean
  message: string
  code: string
}

/**
 * タイムラインを取得するServer Action
 *
 * @param params - ページネーションパラメータ
 * @returns タイムラインイベント一覧
 *
 * 【処理内容】
 * 1. サーバーサイドSupabaseクライアントを作成
 * 2. timeline.serviceを呼び出し
 * 3. 統一されたレスポンス形式で返す
 */
export async function fetchTimeline(
  params: FetchTimelineParams = {}
): Promise<FetchTimelineResponse> {
  try {
    // 【ステップ1】サーバーサイドSupabaseクライアントを作成
    const supabase = await createClient()

    // 【ステップ2】タイムラインサービスを呼び出し
    const result = await fetchTimelineService(supabase, params)

    if (result.error) {
      // エラーケース処理
      const errorMessages: Record<string, string> = {
        UNAUTHORIZED: 'ログインが必要です',
        FETCH_ERROR: 'タイムラインの取得に失敗しました',
      }

      return {
        success: false,
        message: errorMessages[result.error] || 'エラーが発生しました',
        code: result.error,
      }
    }

    // 【ステップ3】成功レスポンス
    return {
      success: true,
      data: result.data,
      hasMore: result.hasMore,
      message: 'タイムラインを取得しました',
      code: 'SUCCESS',
    }
  } catch (error) {
    // 予期しないエラー
    console.error('fetchTimeline Server Action エラー:', error)
    return {
      success: false,
      message: '予期しないエラーが発生しました',
      code: 'UNKNOWN_ERROR',
    }
  }
}
