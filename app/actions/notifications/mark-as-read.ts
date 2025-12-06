/**
 * ファイル名: mark-as-read.ts
 *
 * 【概要】
 * 通知既読更新のServer Action
 * 指定した通知を既読状態にする
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. バリデーション
 * 3. 通知の存在・権限チェック
 * 4. 既読フラグ更新
 *
 * 【主要機能】
 * - 単一通知の既読更新
 * - 権限チェック（自分の通知のみ更新可能）
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 * - @/lib/validation/connections: Zodスキーマ
 *
 * @spec Phase 7: 通知機能
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { notificationIdSchema } from '@/lib/validation/connections'

/**
 * 既読更新結果型
 */
type MarkAsReadResult =
  | {
      success: true
      message: string
      code: 'NOTIFICATION_READ'
    }
  | {
      success: false
      message: string
      code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'NOTIFICATION_NOT_FOUND' | 'UPDATE_ERROR'
    }

/**
 * 通知既読更新Server Action
 *
 * @param notificationId - 既読にする通知ID
 * @returns 更新結果
 *
 * 【処理内容】
 * 1. 認証チェック
 * 2. バリデーション
 * 3. 通知の存在・権限チェック
 * 4. 既読フラグ更新
 *
 * @spec Phase 7: 通知機能
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<MarkAsReadResult> {
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
  const validated = notificationIdSchema.safeParse({ notificationId })
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || '通知IDが不正です',
      code: 'VALIDATION_ERROR'
    }
  }

  // 【ステップ3】通知の存在・権限チェック（自分の通知のみ更新可能）
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('id, is_read')
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !notification) {
    return {
      success: false,
      message: '通知が見つかりません',
      code: 'NOTIFICATION_NOT_FOUND'
    }
  }

  // 既に既読の場合は成功として返す（冪等性）
  if (notification.is_read) {
    return {
      success: true,
      message: '通知は既に既読です',
      code: 'NOTIFICATION_READ'
    }
  }

  // 【ステップ4】既読フラグ更新
  const { error: updateError } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('通知更新エラー:', updateError)
    return {
      success: false,
      message: '通知の更新に失敗しました',
      code: 'UPDATE_ERROR'
    }
  }

  return {
    success: true,
    message: '通知を既読にしました',
    code: 'NOTIFICATION_READ'
  }
}

/**
 * すべての通知を既読にするServer Action
 *
 * @returns 更新結果
 *
 * 【処理内容】
 * 1. 認証チェック
 * 2. 未読通知を一括既読更新
 */
export async function markAllNotificationsAsRead(): Promise<
  | { success: true; message: string; code: 'ALL_NOTIFICATIONS_READ' }
  | { success: false; message: string; code: 'UNAUTHORIZED' | 'UPDATE_ERROR' }
> {
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

  // 【ステップ2】未読通知を一括既読更新
  const { error: updateError } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (updateError) {
    console.error('通知一括更新エラー:', updateError)
    return {
      success: false,
      message: '通知の更新に失敗しました',
      code: 'UPDATE_ERROR'
    }
  }

  return {
    success: true,
    message: 'すべての通知を既読にしました',
    code: 'ALL_NOTIFICATIONS_READ'
  }
}
