/**
 * ファイル名: category-editor.tsx
 *
 * 【概要】
 * つながりのカテゴリ設定エディターコンポーネント
 * 特定のつながり相手に対して、どのカテゴリのイベントを表示するかを設定する
 *
 * 【処理フロー】
 * 1. ユーザーのenabled_categoriesから表示カテゴリを決定
 * 2. 現在のcategory_flagsを初期値として表示
 * 3. チェックボックスでON/OFF切り替え
 * 4. 保存ボタンでServer Actionを呼び出し
 *
 * 【主要機能】
 * - カテゴリチェックボックスの表示
 * - カテゴリ設定の編集
 * - Server Actionとの連携
 *
 * 【依存関係】
 * - @/components/ui/checkbox: チェックボックスコンポーネント
 * - @/components/ui/button: ボタンコンポーネント
 * - @/app/actions/connections/update-categories: カテゴリ更新Action
 *
 * @spec FR-006: つながりごとのカテゴリ設定機能
 * @spec US3-1: 自分が設定したカテゴリのみ表示
 * @spec US3-2: 設定が保存され、次回表示時も反映
 */

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateConnectionCategories } from '@/app/actions/connections/update-categories'

/**
 * カテゴリ情報の型定義
 */
type CategoryInfo = {
  value: string
  label: string
  emoji: string
}

/**
 * カテゴリマスタデータ
 * categoriesテーブルと同期
 */
const CATEGORIES: CategoryInfo[] = [
  { value: 'drinking', label: '飲み', emoji: '🍶' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'tennis', label: 'テニス', emoji: '🎾' },
  { value: 'other', label: 'その他', emoji: '📌' },
]

/**
 * CategoryEditorコンポーネントのProps
 */
type CategoryEditorProps = {
  /** つながり相手のユーザーID */
  targetId: string
  /** つながり相手の表示名 */
  targetName: string
  /** 現在のカテゴリフラグ */
  currentFlags: Record<string, boolean>
  /** 自分のenabled_categories（表示するカテゴリ） */
  enabledCategories: string[]
  /** 編集完了時のコールバック */
  onComplete?: () => void
  /** キャンセル時のコールバック */
  onCancel?: () => void
}

/**
 * CategoryEditorコンポーネント
 *
 * つながりのカテゴリ設定を編集するコンポーネント
 * 自分のenabled_categoriesに含まれるカテゴリのみ表示する
 *
 * @param props - コンポーネントProps
 * @returns カテゴリ編集UI
 *
 * 【使用例】
 * <CategoryEditor
 *   targetId="user-b-id"
 *   targetName="ユーザーB"
 *   currentFlags={{ drinking: true, travel: false }}
 *   enabledCategories={['drinking', 'travel', 'tennis', 'other']}
 *   onComplete={() => setIsEditing(false)}
 *   onCancel={() => setIsEditing(false)}
 * />
 */
export function CategoryEditor({
  targetId,
  targetName,
  currentFlags,
  enabledCategories,
  onComplete,
  onCancel,
}: CategoryEditorProps) {
  // 現在のフラグを編集用にコピー
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    // enabled_categoriesに含まれるカテゴリのみ抽出
    const initialFlags: Record<string, boolean> = {}
    for (const category of enabledCategories) {
      initialFlags[category] = currentFlags[category] ?? false
    }
    return initialFlags
  })

  const [isPending, startTransition] = useTransition()

  // 表示するカテゴリを計算（enabled_categoriesにあるもののみ）
  const displayCategories = CATEGORIES.filter((cat) =>
    enabledCategories.includes(cat.value)
  )

  /**
   * チェックボックスの変更ハンドラ
   */
  const handleCheckChange = (category: string, checked: boolean) => {
    setFlags((prev) => ({
      ...prev,
      [category]: checked,
    }))
  }

  /**
   * 保存ハンドラ
   */
  const handleSave = () => {
    startTransition(async () => {
      const result = await updateConnectionCategories(targetId, flags)

      if (result.success) {
        toast.success(result.message)
        onComplete?.()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div
      data-testid="category-editor"
      className="space-y-4 p-4 border rounded-lg bg-card"
    >
      <div className="space-y-1">
        <h3 className="font-medium text-sm">カテゴリ設定</h3>
        <p className="text-xs text-muted-foreground">
          {targetName}さんの投稿を受け取るカテゴリを選択
        </p>
      </div>

      <div className="space-y-3">
        {displayCategories.map((category) => (
          <div key={category.value} className="flex items-center space-x-3">
            <Checkbox
              id={`category-${category.value}`}
              data-testid={`category-checkbox-${category.value}`}
              checked={flags[category.value] ?? false}
              onCheckedChange={(checked: boolean | 'indeterminate') =>
                handleCheckChange(category.value, checked === true)
              }
              disabled={isPending}
            />
            <Label
              htmlFor={`category-${category.value}`}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </Label>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            キャンセル
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          data-testid="save-categories-button"
        >
          {isPending ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
