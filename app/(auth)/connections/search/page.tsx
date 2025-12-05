/**
 * ファイル名: page.tsx
 *
 * 【概要】
 * ユーザー検索ページ
 * 友人を検索してつながりリクエストを送信する
 *
 * 【処理フロー】
 * 1. 検索クエリを入力
 * 2. Server Actionでユーザー検索
 * 3. 検索結果を表示
 * 4. リクエスト送信ボタンでリクエスト送信
 *
 * 【主要機能】
 * - ユーザー検索
 * - つながりリクエスト送信
 * - 友人ラベル表示
 * - 送信済みバッジ表示
 *
 * 【依存関係】
 * - @/components/connections/user-search-input: 検索入力
 * - @/components/connections/user-search-result: 検索結果
 * - @/app/actions/connections/search-users: 検索アクション
 * - @/app/actions/connections/send-request: リクエスト送信アクション
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 * @spec FR-002: つながりリクエストの送信機能
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserSearchInput } from '@/components/connections/user-search-input'
import { UserSearchResult } from '@/components/connections/user-search-result'
import { searchUsers } from '@/app/actions/connections/search-users'
import { sendConnectionRequest } from '@/app/actions/connections/send-request'

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
 * ユーザー検索ページコンポーネント
 *
 * @returns ユーザー検索ページUI
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 * @spec FR-002: つながりリクエストの送信機能
 */
export default function UserSearchPage() {
  const [users, setUsers] = useState<SearchedUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  /**
   * 検索実行ハンドラー
   */
  const handleSearch = async (query: string) => {
    setIsSearching(true)
    setHasSearched(true)

    try {
      const result = await searchUsers(query)

      if (result.success) {
        setUsers(result.data.users)
        if (result.data.users.length === 0) {
          toast.info('ユーザーが見つかりませんでした')
        }
      } else {
        toast.error(result.message)
        setUsers([])
      }
    } catch (error) {
      console.error('検索エラー:', error)
      toast.error('検索中にエラーが発生しました')
      setUsers([])
    } finally {
      setIsSearching(false)
    }
  }

  /**
   * リクエスト送信ハンドラー
   */
  const handleSendRequest = async (
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await sendConnectionRequest(userId)

      if (result.success) {
        // つながり成立の場合
        if (result.code === 'CONNECTION_ESTABLISHED') {
          toast.success('つながりが成立しました！')
          // 友人状態に更新
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, is_friend: true } : u))
          )
        } else {
          toast.success('リクエストを送信しました')
        }
        return { success: true, message: result.message }
      } else {
        toast.error(result.message)
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error('リクエスト送信エラー:', error)
      toast.error('リクエスト送信中にエラーが発生しました')
      return { success: false, message: 'リクエスト送信中にエラーが発生しました' }
    }
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">ユーザー検索</h1>

      {/* 検索入力 */}
      <div className="mb-6">
        <UserSearchInput onSearch={handleSearch} isLoading={isSearching} />
      </div>

      {/* 検索結果 */}
      {hasSearched && (
        <UserSearchResult
          users={users}
          onSendRequest={handleSendRequest}
          isLoading={isSearching}
        />
      )}

      {/* 初期状態のヒント */}
      {!hasSearched && (
        <div className="text-center py-12 text-muted-foreground">
          <p>ユーザー名またはIDで検索してください</p>
          <p className="text-sm mt-2">
            検索結果から友人にリクエストを送信できます
          </p>
        </div>
      )}
    </div>
  )
}
