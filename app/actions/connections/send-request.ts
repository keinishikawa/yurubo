/**
 * ファイル名: send-request.ts
 *
 * 【概要】
 * つながりリクエスト送信のServer Action
 * リクエストを送信し、相手に通知を作成する
 * 同時リクエスト時は自動的につながりを成立させる
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. バリデーション
 * 3. 自分自身へのリクエスト禁止チェック
 * 4. 既存つながりチェック
 * 5. 既存リクエストチェック
 * 6. 同時リクエスト検出（相手からのリクエストがあれば即成立）
 * 7. リクエスト送信または即時つながり成立
 * 8. 通知作成
 *
 * 【主要機能】
 * - つながりリクエストの送信
 * - 同時リクエスト検出と自動つながり成立
 * - リクエスト受信者への通知作成
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 * - @/lib/validation/connections: Zodスキーマ
 *
 * @spec FR-002: つながりリクエストの送信機能
 * @spec US1-2: リクエスト送信後、相手に通知が届く
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { sendRequestSchema } from '@/lib/validation/connections'

/**
 * リクエスト送信結果型
 */
type SendRequestResult =
  | {
      success: true
      message: string
      code: 'REQUEST_SENT' | 'CONNECTION_ESTABLISHED'
      data: {
        request_id?: string
        connection_id?: string
      }
    }
  | {
      success: false
      message: string
      code:
        | 'UNAUTHORIZED'
        | 'SELF_REQUEST_NOT_ALLOWED'
        | 'REQUEST_ALREADY_PENDING'
        | 'ALREADY_CONNECTED'
        | 'USER_NOT_FOUND'
        | 'VALIDATION_ERROR'
        | 'DATABASE_ERROR'
    }

/**
 * 双方向つながりを作成するヘルパー関数
 * SECURITY DEFINER関数を使用してRLSをバイパス
 *
 * @param supabase - Supabaseクライアント
 * @param partnerId - つながり相手のユーザーID
 * @returns 成功時はtrue、失敗時はfalse
 */
async function createBidirectionalConnection(
  supabase: ReturnType<typeof createClient>,
  partnerId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('create_bidirectional_connection', {
    partner_id: partnerId
  })

  if (error) {
    console.error('双方向つながり作成エラー:', error)
    return false
  }

  // 型アサーション
  const result = data as { success: boolean } | null
  return result?.success === true
}

/**
 * つながりリクエスト送信Server Action
 *
 * @param receiverId - リクエスト送信先ユーザーID
 * @param message - 任意メッセージ（最大200文字）
 * @returns 送信結果
 *
 * 【処理内容】
 * 1. 認証チェック
 * 2. 入力バリデーション
 * 3. 各種チェック（自己リクエスト、既存つながり、既存リクエスト）
 * 4. 同時リクエスト検出
 * 5. リクエスト作成または即時つながり成立
 * 6. 通知作成
 *
 * @spec FR-002: つながりリクエストの送信機能
 * @spec US1-2: リクエスト送信後、相手に通知が届く
 */
export async function sendConnectionRequest(
  receiverId: string,
  message?: string
): Promise<SendRequestResult> {
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
  const validated = sendRequestSchema.safeParse({ receiverId, message })
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || '入力値が不正です',
      code: 'VALIDATION_ERROR'
    }
  }

  const senderId = user.id

  // 【ステップ3】自分自身へのリクエスト禁止チェック
  if (receiverId === senderId) {
    return {
      success: false,
      message: '自分自身にリクエストを送信することはできません',
      code: 'SELF_REQUEST_NOT_ALLOWED'
    }
  }

  // 【ステップ4】受信者の存在確認
  const { data: receiver, error: receiverError } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', receiverId)
    .single()

  if (receiverError || !receiver) {
    return {
      success: false,
      message: 'ユーザーが見つかりません',
      code: 'USER_NOT_FOUND'
    }
  }

  // 【ステップ5】既存つながりチェック
  const { data: existingConnection } = await supabase
    .from('connections')
    .select('user_id, target_id')
    .eq('user_id', senderId)
    .eq('target_id', receiverId)
    .single()

  if (existingConnection) {
    return {
      success: false,
      message: 'すでにつながりがあります',
      code: 'ALREADY_CONNECTED'
    }
  }

  // 【ステップ6】既存リクエストチェック（送信側）
  const { data: existingSentRequest } = await supabase
    .from('connection_requests')
    .select('id')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .single()

  if (existingSentRequest) {
    return {
      success: false,
      message: 'すでにリクエストを送信済みです',
      code: 'REQUEST_ALREADY_PENDING'
    }
  }

  // 【ステップ7】同時リクエスト検出（相手からのリクエストがあるか）
  const { data: receivedRequest } = await supabase
    .from('connection_requests')
    .select('id')
    .eq('sender_id', receiverId)
    .eq('receiver_id', senderId)
    .single()

  if (receivedRequest) {
    // 同時リクエスト検出！ → 即座につながりを成立させる

    // 相手からのリクエストを削除
    await supabase.from('connection_requests').delete().eq('id', receivedRequest.id)

    // 双方向つながりを作成（SECURITY DEFINER関数を使用）
    const connectionCreated = await createBidirectionalConnection(supabase, receiverId)

    if (!connectionCreated) {
      return {
        success: false,
        message: 'つながりの作成に失敗しました',
        code: 'DATABASE_ERROR'
      }
    }

    // 送信者の情報を取得
    const { data: senderInfo } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', senderId)
      .single()

    // 両者に「つながり成立」通知を送信
    await supabase.from('notifications').insert([
      {
        user_id: senderId,
        type: 'connection_accepted',
        title: 'つながりが成立しました',
        body: `${receiver.display_name}さんとつながりました`,
        data: {
          target_id: receiverId,
          target_name: receiver.display_name,
          link: '/connections'
        }
      },
      {
        user_id: receiverId,
        type: 'connection_accepted',
        title: 'つながりが成立しました',
        body: `${senderInfo?.display_name || 'ユーザー'}さんとつながりました`,
        data: {
          target_id: senderId,
          target_name: senderInfo?.display_name,
          link: '/connections'
        }
      }
    ])

    return {
      success: true,
      message: 'つながりが成立しました',
      code: 'CONNECTION_ESTABLISHED',
      data: {
        connection_id: `${senderId}-${receiverId}`
      }
    }
  }

  // 【ステップ8】通常のリクエスト送信
  const { data: newRequest, error: insertError } = await supabase
    .from('connection_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      message: message || null
    })
    .select('id')
    .single()

  if (insertError || !newRequest) {
    console.error('リクエスト作成エラー:', insertError)
    return {
      success: false,
      message: 'リクエストの送信に失敗しました',
      code: 'DATABASE_ERROR'
    }
  }

  // 送信者の情報を取得
  const { data: senderInfo } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', senderId)
    .single()

  // 【ステップ9】受信者に通知を作成
  await supabase.from('notifications').insert({
    user_id: receiverId,
    type: 'connection_request',
    title: 'つながりリクエストを受信しました',
    body: `${senderInfo?.display_name || 'ユーザー'}さんからつながりリクエストが届きました`,
    data: {
      request_id: newRequest.id,
      sender_id: senderId,
      sender_name: senderInfo?.display_name,
      link: '/connections/requests'
    }
  })

  return {
    success: true,
    message: 'リクエストを送信しました',
    code: 'REQUEST_SENT',
    data: {
      request_id: newRequest.id
    }
  }
}
