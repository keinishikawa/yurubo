/**
 * ファイル名: user-search-result.tsx
 *
 * 【概要】
 * ユーザー検索結果コンポーネント
 * 検索結果のユーザー一覧を表示し、リクエスト送信ボタンを提供
 *
 * 【処理フロー】
 * 1. 検索結果を受け取る
 * 2. 各ユーザーの状態（友人/送信済み/未接続）を表示
 * 3. リクエスト送信ボタンをクリックで送信
 *
 * 【主要機能】
 * - ユーザー検索結果表示
 * - 友人ラベル表示（is_friend: true）
 * - 送信済みバッジ表示（has_pending_request: true）
 * - リクエスト送信ボタン
 *
 * 【依存関係】
 * - @/components/ui/button: ボタンコンポーネント
 * - @/components/ui/card: カードコンポーネント
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 * @spec FR-002: つながりリクエストの送信機能
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * 検索結果のユーザー型
 */
type SearchedUser = {
  id: string
  display_name: string
  avatar_url: string | null
  is_friend: boolean
  has_pending_request: boolean
}

/**
 * UserSearchResultコンポーネントのProps
 */
type UserSearchResultProps = {
  /** 検索結果のユーザー一覧 */
  users: SearchedUser[]
  /** リクエスト送信時のコールバック */
  onSendRequest: (userId: string) => Promise<{ success: boolean; message: string }>
  /** ローディング状態 */
  isLoading?: boolean
}

/**
 * ユーザー検索結果コンポーネント
 *
 * @param props - コンポーネントプロパティ
 * @returns 検索結果一覧UI
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 * @spec FR-002: つながりリクエストの送信機能
 */
export function UserSearchResult({
  users,
  onSendRequest,
  isLoading = false
}: UserSearchResultProps) {
  // 各ユーザーごとの送信中状態を管理
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())
  // リクエスト送信済みのユーザーIDを管理
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  /**
   * リクエスト送信ハンドラー
   */
  const handleSendRequest = async (userId: string) => {
    setSendingIds((prev) => new Set(prev).add(userId))

    try {
      const result = await onSendRequest(userId)
      if (result.success) {
        setSentIds((prev) => new Set(prev).add(userId))
      }
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  if (users.length === 0) {
    return (
      <div
        data-testid="no-results"
        className="text-center py-8 text-muted-foreground"
      >
        ユーザーが見つかりませんでした
      </div>
    )
  }

  return (
    <div data-testid="search-results" className="space-y-3">
      {users.map((user) => {
        const isSending = sendingIds.has(user.id)
        const hasSent = sentIds.has(user.id) || user.has_pending_request

        return (
          <Card
            key={user.id}
            data-testid="user-result"
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {/* アバター */}
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {user.display_name.charAt(0)}
                  </span>
                )}
              </div>

              {/* ユーザー名 */}
              <div>
                <p data-testid="user-name" className="font-medium">
                  {user.display_name}
                </p>
                {user.is_friend && (
                  <span
                    data-testid="friend-label"
                    className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full"
                  >
                    友人
                  </span>
                )}
              </div>
            </div>

            {/* アクションボタン */}
            <div>
              {user.is_friend ? null : hasSent ? (
                <span
                  data-testid="request-sent-badge"
                  className="text-xs text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full"
                >
                  送信済み
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleSendRequest(user.id)}
                  disabled={isLoading || isSending}
                  data-testid="send-request-button"
                >
                  {isSending ? '送信中...' : 'リクエスト送信'}
                </Button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
