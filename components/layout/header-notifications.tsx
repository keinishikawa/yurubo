/**
 * ファイル名: header-notifications.tsx
 *
 * 【概要】
 * ヘッダー用通知コンポーネント
 * Server Componentから呼び出し可能なラッパー
 * 認証状態をチェックして通知バッジを表示
 *
 * 【主要機能】
 * - 認証ユーザーのみに通知バッジを表示
 * - 初期未読件数をサーバーサイドで取得
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 * - NotificationBadge: 通知バッジコンポーネント
 *
 * @spec Phase 7: 通知機能
 */

import { createClient } from '@/lib/supabase/server'
import { NotificationBadge } from '@/components/connections/notification-badge'

/**
 * ヘッダー用通知コンポーネント
 *
 * 【機能】
 * - サーバーサイドで認証チェック
 * - 認証済みユーザーにのみNotificationBadgeを表示
 * - 初期未読件数を取得してPropsとして渡す
 */
export async function HeaderNotifications() {
  const supabase = createClient()

  // 認証チェック
  const {
    data: { user }
  } = await supabase.auth.getUser()

  // 未認証の場合は何も表示しない
  if (!user) {
    return null
  }

  // 初期未読件数を取得
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return <NotificationBadge initialUnreadCount={unreadCount || 0} />
}
