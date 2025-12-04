/**
 * ファイル名: get-requests.ts
 *
 * 【概要】
 * 受信したつながりリクエスト一覧取得のServer Action
 * ログインユーザーが受信した有効なリクエストを取得する
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. 受信リクエストをDBから取得（期限切れを除外）
 * 3. 送信者情報を含めて返却
 *
 * 【主要機能】
 * - 受信リクエスト一覧取得
 * - 期限切れリクエストの自動除外
 * - 送信者のプロフィール情報取得
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 *
 * @spec US2-1: リクエスト一覧ページで送信者名とリクエスト日時を表示
 */

'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * リクエスト情報型
 */
type ReceivedRequest = {
  id: string
  sender: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  message: string | null
  created_at: string
  expires_at: string
}

/**
 * リクエスト一覧取得結果型
 */
type GetRequestsResult =
  | {
      success: true
      message: string
      data: {
        requests: ReceivedRequest[]
      }
    }
  | {
      success: false
      message: string
      code: 'UNAUTHORIZED' | 'FETCH_ERROR'
    }

/**
 * 受信したつながりリクエスト一覧取得Server Action
 *
 * @returns リクエスト一覧
 *
 * 【処理内容】
 * 1. 認証チェック
 * 2. 期限切れを除外してリクエストを取得
 * 3. 送信者情報を含めて返却
 *
 * @spec US2-1: リクエスト一覧ページで送信者名とリクエスト日時を表示
 */
export async function getReceivedRequests(): Promise<GetRequestsResult> {
  // 【ステップ1】認証チェック
  const supabase = createClient()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      message: 'ログインが必要です',
      code: 'UNAUTHORIZED'
    }
  }

  // 【ステップ2】受信リクエストを取得（期限切れを除外）
  const now = new Date().toISOString()

  const { data: requests, error: fetchError } = await supabase
    .from('connection_requests')
    .select(
      `
      id,
      message,
      created_at,
      expires_at,
      sender:users!connection_requests_sender_id_fkey (
        id,
        display_name,
        avatar_url
      )
    `
    )
    .eq('receiver_id', user.id)
    .gt('expires_at', now) // 期限切れを除外
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('リクエスト取得エラー:', fetchError)
    return {
      success: false,
      message: 'リクエストの取得に失敗しました',
      code: 'FETCH_ERROR'
    }
  }

  // 【ステップ3】データを整形して返却
  const formattedRequests: ReceivedRequest[] = (requests || []).map((req) => ({
    id: req.id,
    sender: {
      id: (req.sender as { id: string }).id,
      display_name: (req.sender as { display_name: string }).display_name,
      avatar_url: (req.sender as { avatar_url: string | null }).avatar_url
    },
    message: req.message,
    created_at: req.created_at,
    expires_at: req.expires_at
  }))

  return {
    success: true,
    message:
      formattedRequests.length > 0
        ? `${formattedRequests.length}件のリクエストがあります`
        : 'リクエストはありません',
    data: {
      requests: formattedRequests
    }
  }
}
