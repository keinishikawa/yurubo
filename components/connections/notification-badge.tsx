/**
 * ファイル名: notification-badge.tsx
 *
 * 【概要】
 * 通知バッジコンポーネント
 * ナビゲーションに配置し、通知一覧へのアクセスと未読件数を表示
 *
 * 【主要機能】
 * - 通知アイコン表示
 * - 未読件数バッジ表示
 * - クリックでドロップダウン表示
 * - 通知一覧のプレビュー
 * - 通知クリックで既読更新
 *
 * 【依存関係】
 * - shadcn-ui: Button
 * - lucide-react: Bell icon
 * - Server Actions: getNotifications, markNotificationAsRead
 *
 * @spec Phase 7: 通知機能
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getNotifications } from '@/app/actions/notifications/get-notifications'
import { markNotificationAsRead } from '@/app/actions/notifications/mark-as-read'
import { cn } from '@/lib/utils'

/**
 * 通知アイテムの型
 */
type NotificationItem = {
  id: string
  type: 'connection_request' | 'connection_accepted'
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

/**
 * 通知バッジのProps
 */
type NotificationBadgeProps = {
  /** 初期表示用の未読件数（サーバーサイドで取得した場合） */
  initialUnreadCount?: number
  /** カスタムクラス名 */
  className?: string
}

/**
 * 相対時間を計算するヘルパー関数
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'たった今'
  if (diffMinutes < 60) return `${diffMinutes}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

/**
 * 通知バッジコンポーネント
 *
 * 【機能】
 * - ベルアイコンと未読件数バッジを表示
 * - クリックでドロップダウンメニューを開く
 * - 通知をクリックすると既読にして遷移
 */
/**
 * 通知プレビューの最大件数
 */
const NOTIFICATION_PREVIEW_LIMIT = 10

/**
 * バッジ表示の最大件数（99+表示用）
 */
const NOTIFICATION_BADGE_MAX = 99

/**
 * ポーリング間隔（ミリ秒）
 */
const POLLING_INTERVAL_MS = 30000

/**
 * 通知バッジコンポーネント
 *
 * 【機能】
 * - ベルアイコンと未読件数バッジを表示
 * - クリックでドロップダウンメニューを開く
 * - 通知をクリックすると既読にして遷移
 */
export function NotificationBadge({
  initialUnreadCount = 0,
  className
}: NotificationBadgeProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 通知を取得する
   */
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getNotifications({ limit: NOTIFICATION_PREVIEW_LIMIT })
      if (result.success) {
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unread_count)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error('通知取得エラー:', err)
      setError('通知の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * ドロップダウンを開いたときに通知を取得
   */
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  /**
   * 定期的に未読件数を更新（ページがアクティブな場合のみ）
   */
  useEffect(() => {
    // 初回取得
    fetchNotifications()

    // 定期更新（ページがアクティブな場合のみ）
    const interval = setInterval(() => {
      if (!isOpen && document.visibilityState === 'visible') {
        // ドロップダウンが閉じていて、ページが表示されている場合のみ軽量な更新
        getNotifications({ unread_only: true, limit: 1 })
          .then((result) => {
            if (result.success) {
              setUnreadCount(result.data.unread_count)
            }
          })
          .catch(console.error)
      }
    }, POLLING_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isOpen, fetchNotifications])

  /**
   * 通知をクリックしたときの処理
   */
  const handleNotificationClick = async (notification: NotificationItem) => {
    // 未読の場合は既読にする
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id)
        // ローカル状態を更新
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error('既読更新エラー:', error)
      }
    }

    // ドロップダウンを閉じる
    setIsOpen(false)

    // リンク先に遷移（型安全なチェック）
    const link = typeof notification.data.link === 'string' ? notification.data.link : null
    if (link) {
      router.push(link)
    }
  }

  /**
   * ドロップダウンの外側をクリックしたときに閉じる
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-notification-dropdown]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={cn('relative', className)} data-notification-dropdown>
      {/* 通知バッジボタン */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`通知${unreadCount > 0 ? `（${unreadCount}件の未読）` : ''}${isOpen ? '（開いています）' : ''}`}
        aria-expanded={isOpen}
        data-testid="notification-badge"
        className="relative"
      >
        <Bell className="h-5 w-5" />

        {/* 未読件数バッジ */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-medium bg-destructive text-destructive-foreground rounded-full"
            data-testid="notification-count"
          >
            {unreadCount > NOTIFICATION_BADGE_MAX ? `${NOTIFICATION_BADGE_MAX}+` : unreadCount}
          </span>
        )}
      </Button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg z-50"
          data-testid="notification-dropdown"
        >
          {/* ヘッダー */}
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium">通知</h3>
          </div>

          {/* 通知一覧 */}
          <div
            className="max-h-80 overflow-y-auto"
            data-testid="notification-list"
          >
            {isLoading ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <p>読み込み中...</p>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-destructive">
                <p>{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-sm text-muted-foreground hover:text-foreground underline"
                >
                  再読み込み
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div
                className="px-4 py-8 text-center text-muted-foreground"
                data-testid="no-notifications"
              >
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>通知はありません</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0',
                        !notification.is_read && 'bg-accent/50'
                      )}
                      data-testid="notification-item"
                      data-type={notification.type}
                      data-unread={!notification.is_read}
                    >
                      <div className="flex items-start gap-3">
                        {/* 未読インジケーター */}
                        {!notification.is_read && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}

                        <div className={cn('flex-1', notification.is_read && 'pl-5')}>
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getRelativeTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* フッター */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setIsOpen(false)
                  router.push('/connections/requests')
                }}
              >
                すべての通知を見る
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
