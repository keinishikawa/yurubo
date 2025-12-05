/**
 * ファイル名: accept-request.ts
 *
 * 【概要】
 * つながりリクエスト承認のServer Action
 * リクエストを承認し、双方向のつながりを作成する
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. バリデーション
 * 3. リクエストの存在・権限チェック
 * 4. 期限切れチェック
 * 5. 既存つながりチェック
 * 6. 双方向つながり作成
 * 7. リクエスト削除
 * 8. 送信者への通知作成
 *
 * 【主要機能】
 * - リクエスト承認
 * - 双方向つながり作成
 * - 送信者への承認通知
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 * - @/lib/validation/connections: Zodスキーマ
 *
 * @spec FR-003: つながりリクエストの承認機能
 * @spec FR-015: 承認時、送信者に通知
 * @spec US2-2: 承認後、つながりが成立しリクエスト一覧から消える
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requestIdSchema } from '@/lib/validation/connections'

/**
 * 承認結果型
 */
type AcceptRequestResult =
  | {
      success: true
      message: string
      code: 'CONNECTION_ESTABLISHED'
      data: {
        connection: {
          user_id: string
          target_id: string
        }
      }
    }
  | {
      success: false
      message: string
      code:
        | 'UNAUTHORIZED'
        | 'VALIDATION_ERROR'
        | 'REQUEST_NOT_FOUND'
        | 'REQUEST_EXPIRED'
        | 'ALREADY_CONNECTED'
        | 'DATABASE_ERROR'
    }

/**
 * つながりリクエスト承認Server Action
 *
 * @param requestId - リクエストID
 * @returns 承認結果
 *
 * 【処理内容】
 * 1. 認証チェック
 * 2. バリデーション
 * 3. リクエストの存在・権限・期限チェック
 * 4. 既存つながりチェック
 * 5. 双方向つながり作成
 * 6. リクエスト削除
 * 7. 通知作成
 *
 * @spec FR-003: つながりリクエストの承認機能
 * @spec FR-015: 承認時、送信者に通知
 */
export async function acceptConnectionRequest(
  requestId: string
): Promise<AcceptRequestResult> {
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

  // 【ステップ2】バリデーション
  const validated = requestIdSchema.safeParse({ requestId })
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || 'リクエストIDが不正です',
      code: 'VALIDATION_ERROR'
    }
  }

  // 【ステップ3】リクエストの存在・権限チェック
  const { data: request, error: requestError } = await supabase
    .from('connection_requests')
    .select(
      `
      id,
      sender_id,
      receiver_id,
      expires_at,
      sender:users!connection_requests_sender_id_fkey (
        id,
        display_name
      )
    `
    )
    .eq('id', requestId)
    .eq('receiver_id', user.id) // 自分が受信者であること
    .single()

  if (requestError || !request) {
    return {
      success: false,
      message: 'リクエストが見つかりません',
      code: 'REQUEST_NOT_FOUND'
    }
  }

  // 【ステップ4】期限切れチェック
  const now = new Date()
  const expiresAt = new Date(request.expires_at)
  if (expiresAt < now) {
    // 期限切れリクエストを削除
    await supabase.from('connection_requests').delete().eq('id', requestId)

    return {
      success: false,
      message: 'リクエストの有効期限が切れています',
      code: 'REQUEST_EXPIRED'
    }
  }

  // 【ステップ5】既存つながりチェック
  const { data: existingConnection } = await supabase
    .from('connections')
    .select('user_id, target_id')
    .eq('user_id', user.id)
    .eq('target_id', request.sender_id)
    .single()

  if (existingConnection) {
    // 既にあるならリクエストだけ削除
    await supabase.from('connection_requests').delete().eq('id', requestId)

    return {
      success: false,
      message: 'すでにつながりがあります',
      code: 'ALREADY_CONNECTED'
    }
  }

  // 【ステップ6】双方向つながり作成（SECURITY DEFINER関数を使用）
  const { data: connectionResult, error: connectionError } = await supabase.rpc(
    'create_bidirectional_connection',
    { partner_id: request.sender_id }
  )

  if (connectionError) {
    console.error('つながり作成エラー:', connectionError)
    return {
      success: false,
      message: 'つながりの作成に失敗しました',
      code: 'DATABASE_ERROR'
    }
  }

  // 関数の戻り値をチェック（型アサーション）
  const result = connectionResult as { success: boolean; message?: string } | null
  if (result && !result.success) {
    console.error('つながり作成エラー:', result)
    return {
      success: false,
      message: result.message || 'つながりの作成に失敗しました',
      code: 'DATABASE_ERROR'
    }
  }

  // 【ステップ7】リクエスト削除
  await supabase.from('connection_requests').delete().eq('id', requestId)

  // 承認者の情報を取得
  const { data: accepterInfo } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // 【ステップ8】送信者に通知を作成
  await supabase.from('notifications').insert({
    user_id: request.sender_id,
    type: 'connection_accepted',
    title: 'つながりリクエストが承認されました',
    body: `${accepterInfo?.display_name || 'ユーザー'}さんがリクエストを承認しました`,
    data: {
      target_id: user.id,
      target_name: accepterInfo?.display_name,
      link: '/connections'
    }
  })

  return {
    success: true,
    message: 'つながりが成立しました',
    code: 'CONNECTION_ESTABLISHED',
    data: {
      connection: {
        user_id: user.id,
        target_id: request.sender_id
      }
    }
  }
}
