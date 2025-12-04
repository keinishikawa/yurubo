/**
 * ファイル名: user-search-input.tsx
 *
 * 【概要】
 * ユーザー検索入力コンポーネント
 * 検索クエリを入力し、検索ボタンで検索を実行する
 *
 * 【処理フロー】
 * 1. ユーザーが検索クエリを入力
 * 2. 検索ボタンをクリック
 * 3. onSearch コールバックを呼び出し
 *
 * 【主要機能】
 * - 検索クエリ入力
 * - 検索ボタン
 * - ローディング状態表示
 * - Enterキーでの検索実行
 *
 * 【依存関係】
 * - @/components/ui/input: 入力コンポーネント
 * - @/components/ui/button: ボタンコンポーネント
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 */

'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * UserSearchInputコンポーネントのProps
 */
type UserSearchInputProps = {
  /** 検索実行時のコールバック */
  onSearch: (query: string) => void
  /** ローディング状態 */
  isLoading?: boolean
  /** プレースホルダーテキスト */
  placeholder?: string
}

/**
 * ユーザー検索入力コンポーネント
 *
 * @param props - コンポーネントプロパティ
 * @returns 検索入力UI
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 */
export function UserSearchInput({
  onSearch,
  isLoading = false,
  placeholder = 'ユーザー名またはIDで検索'
}: UserSearchInputProps) {
  const [query, setQuery] = useState('')

  /**
   * フォーム送信ハンドラー
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  /**
   * Enterキー押下ハンドラー
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (query.trim()) {
        onSearch(query.trim())
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        data-testid="user-search-input"
        className="flex-1"
        aria-label="ユーザー検索"
      />
      <Button
        type="submit"
        disabled={isLoading || !query.trim()}
        data-testid="search-button"
      >
        {isLoading ? '検索中...' : '検索'}
      </Button>
    </form>
  )
}
