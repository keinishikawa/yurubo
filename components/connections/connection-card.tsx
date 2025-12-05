/**
 * ファイル名: connection-card.tsx
 *
 * 【概要】
 * つながりカードコンポーネント
 * つながりリストの各アイテムを表示するカードUI
 *
 * 【主要機能】
 * - ユーザー情報表示（アバター、名前）
 * - カテゴリバッジ表示
 * - 削除ボタン
 *
 * 【依存関係】
 * - shadcn-ui: Card, Button, Badge
 *
 * @spec US4-1: つながりリストにカードUIで表示
 */

'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Settings } from 'lucide-react'

/**
 * カテゴリ情報の型
 */
type CategoryInfo = {
  value: string
  label: string
  emoji: string
}

/**
 * つながりカードのProps
 */
type ConnectionCardProps = {
  /** つながり相手のID */
  targetId: string
  /** つながり相手の表示名 */
  displayName: string
  /** つながり相手のアバターURL */
  avatarUrl: string | null
  /** カテゴリフラグ（キー: カテゴリ値、値: ON/OFF） */
  categoryFlags: Record<string, boolean>
  /** 利用可能なカテゴリ一覧（表示用） */
  availableCategories: CategoryInfo[]
  /** カテゴリ編集ボタンクリック時のコールバック */
  onEditCategories: (targetId: string, targetName: string) => void
  /** 削除ボタンクリック時のコールバック */
  onDelete: (targetId: string) => void
  /** 削除中フラグ */
  isDeleting?: boolean
}

/**
 * つながりカードコンポーネント
 *
 * 【表示内容】
 * - アバター画像（または初期文字アイコン）
 * - ユーザー名
 * - ONになっているカテゴリのバッジ
 * - 削除ボタン
 */
export function ConnectionCard({
  targetId,
  displayName,
  avatarUrl,
  categoryFlags,
  availableCategories,
  onEditCategories,
  onDelete,
  isDeleting = false,
}: ConnectionCardProps) {
  // ONになっているカテゴリのみをフィルタ
  const activeCategories = availableCategories.filter(
    (cat) => categoryFlags[cat.value] === true
  )

  return (
    <Card data-testid="connection-card" className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* アバター */}
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${displayName}のアバター`}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg"
                aria-label={`${displayName}のアバター`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* ユーザー情報 */}
          <div className="flex-grow min-w-0">
            <h3 className="font-medium text-base truncate" data-testid="connection-name">
              {displayName}
            </h3>

            {/* カテゴリバッジ */}
            {activeCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {activeCategories.map((cat) => (
                  <span
                    key={cat.value}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
                    data-testid={`category-badge-${cat.value}`}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                ))}
              </div>
            )}

            {activeCategories.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                カテゴリ未設定
              </p>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex-shrink-0 flex gap-1">
            {/* カテゴリ編集ボタン */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditCategories(targetId, displayName)}
              aria-label={`${displayName}のカテゴリを編集`}
              data-testid="edit-categories-button"
            >
              <Settings className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>

            {/* 削除ボタン */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(targetId)}
              disabled={isDeleting}
              aria-label={`${displayName}とのつながりを削除`}
              data-testid="delete-connection-button"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
