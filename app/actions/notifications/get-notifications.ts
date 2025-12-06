/**
 * ファイル名: get-notifications.ts
 *
 * 【概要】
 * 通知一覧取得のServer Action
 * ログインユーザーの通知リストを取得する
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. バリデーション
 * 3. 通知一覧取得（オプションでフィルタ）
 * 4. 未読件数カウント
 *
 * 【主要機能】
 * - 通知一覧の取得
 * - 未読フィルタリング
 * - ページネーション
 * - 未読件数の取得
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 * - @/lib/validation/connections: Zodスキーマ
 *
 * @spec Phase 7: 通知機能
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getNotificationsSchema } from '@/lib/validation/connections'

/**
 * 通知タイプの定義
 */
type NotificationType = 'connection_request' | 'connection_accepted'

/**
 * 通知アイテムの型
 */
type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

/**
 * 通知取得結果型
 */
type GetNotificationsResult =
  | {
      success: true
      message: string
      data: {
        notifications: NotificationItem[]
        unread_count: number
      }
    }
  | {
      success: false
      message: string
      code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'FETCH_ERROR'
    }

/**
 * 通知取得オプション型
 */
type GetNotificationsOptions = {
  unread_only?: boolean
  limit?: number
  offset?: number
}

/**
 * 通知一覧取得Server Action
 *
 * @param options - 取得オプション（unread_only, limit, offset）
 * @returns 通知一覧と未読件数
 *
 * 【処理内容】
 * 1. 認証チェック
 * 2. オプションのバリデーション
 * 3. 通知一覧取得
 * 4. 未読件数カウント
 *
 * @spec Phase 7: 通知機能
 */
export async function getNotifications(
  options?: GetNotificationsOptions
): Promise<GetNotificationsResult> {
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
  const validated = getNotificationsSchema.safeParse(options || {})
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || '入力値が不正です',
      code: 'VALIDATION_ERROR'
    }
  }

  const { unread_only, limit, offset } = validated.data

  // 【ステップ3】通知一覧取得
  let query = supabase
    .from('notifications')
    .select('id, type, title, body, data, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // 未読のみフィルタ
  if (unread_only) {
    query = query.eq('is_read', false)
  }

  const { data: notifications, error: fetchError } = await query

  if (fetchError) {
    console.error('通知取得エラー:', fetchError)
    return {
      success: false,
      message: '通知の取得に失敗しました',
      code: 'FETCH_ERROR'
    }
  }

  // 【ステップ4】未読件数カウント
  const { count: unreadCount, error: countError } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (countError) {
    console.error('未読件数取得エラー:', countError)
    // エラーでも通知一覧は返す（未読件数は0として扱う）
  }

  return {
    success: true,
    message: '通知を取得しました',
    data: {
      notifications: (notifications || []).map((n) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        body: n.body,
        data: (n.data || {}) as Record<string, unknown>,
        is_read: n.is_read,
        created_at: n.created_at
      })),
      unread_count: unreadCount || 0
    }
  }
}
