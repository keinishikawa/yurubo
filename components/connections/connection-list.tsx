/**
 * ファイル名: connection-list.tsx
 *
 * 【概要】
 * つながりリストコンポーネント
 * つながりリストの一覧表示とフィルタ・検索機能を提供
 *
 * 【主要機能】
 * - つながりカードの一覧表示
 * - 空状態メッセージ
 * - ローディング状態
 *
 * 【依存関係】
 * - ConnectionCard: 各つながりの表示
 *
 * @spec FR-005: つながりリストの一覧表示機能
 */

'use client'

import { ConnectionCard } from './connection-card'

/**
 * つながり情報の型
 */
export type ConnectionItem = {
  target: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  category_flags: Record<string, boolean>
  created_at: string
}

/**
 * カテゴリ情報の型
 */
type CategoryInfo = {
  value: string
  label: string
  emoji: string
}

/**
 * つながりリストのProps
 */
type ConnectionListProps = {
  /** つながり一覧 */
  connections: ConnectionItem[]
  /** 利用可能なカテゴリ一覧 */
  availableCategories: CategoryInfo[]
  /** カテゴリ編集ボタンクリック時のコールバック */
  onEditCategories: (targetId: string, targetName: string) => void
  /** 削除ボタンクリック時のコールバック */
  onDelete: (targetId: string) => void
  /** 削除中のターゲットID */
  deletingTargetId?: string | null
  /** ローディング状態 */
  isLoading?: boolean
}

/**
 * つながりリストコンポーネント
 *
 * 【表示内容】
 * - つながりカードの一覧
 * - 空状態メッセージ（つながりが0件の場合）
 * - ローディング状態
 */
export function ConnectionList({
  connections,
  availableCategories,
  onEditCategories,
  onDelete,
  deletingTargetId = null,
  isLoading = false,
}: ConnectionListProps) {
  // ローディング状態
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="connection-list-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  // 空状態
  if (connections.length === 0) {
    return (
      <div
        className="text-center py-12"
        data-testid="connection-list-empty"
      >
        <p className="text-muted-foreground">つながりがありません</p>
        <p className="text-sm text-muted-foreground mt-2">
          友人を検索してつながりリクエストを送信しましょう
        </p>
      </div>
    )
  }

  // つながりリスト表示
  return (
    <div className="space-y-3" data-testid="connection-list">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.target.id}
          targetId={connection.target.id}
          displayName={connection.target.display_name}
          avatarUrl={connection.target.avatar_url}
          categoryFlags={connection.category_flags}
          availableCategories={availableCategories}
          onEditCategories={onEditCategories}
          onDelete={onDelete}
          isDeleting={deletingTargetId === connection.target.id}
        />
      ))}
    </div>
  )
}
