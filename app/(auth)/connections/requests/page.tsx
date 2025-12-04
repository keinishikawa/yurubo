/**
 * ファイル名: page.tsx
 *
 * 【概要】
 * つながりリクエスト一覧ページ
 * 受信したリクエストを表示し、承認/拒否を行う
 *
 * 【処理フロー】
 * 1. ページ読み込み時にリクエスト一覧を取得
 * 2. リクエストカードを表示
 * 3. 承認/拒否ボタンでアクション実行
 *
 * 【主要機能】
 * - 受信リクエスト一覧表示
 * - リクエスト承認
 * - リクエスト拒否（US2で実装）
 *
 * 【依存関係】
 * - @/components/connections/request-card: リクエストカード
 * - @/app/actions/connections/get-requests: リクエスト一覧取得
 * - @/app/actions/connections/accept-request: リクエスト承認
 *
 * @spec US2-1: リクエスト一覧ページで送信者名とリクエスト日時を表示
 * @spec US2-2: 承認後、つながりが成立しリクエスト一覧から消える
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { RequestCard } from '@/components/connections/request-card'
import { getReceivedRequests } from '@/app/actions/connections/get-requests'
import { acceptConnectionRequest } from '@/app/actions/connections/accept-request'

/**
 * リクエスト情報型
 */
type ReceivedRequest = {
  id: string
  sender: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  message: string | null
  created_at: string
  expires_at: string
}

/**
 * つながりリクエスト一覧ページコンポーネント
 *
 * @returns リクエスト一覧ページUI
 *
 * @spec US2-1: リクエスト一覧ページで送信者名とリクエスト日時を表示
 */
export default function RequestsPage() {
  const [requests, setRequests] = useState<ReceivedRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * リクエスト一覧を取得
   */
  const fetchRequests = useCallback(async () => {
    try {
      const result = await getReceivedRequests()

      if (result.success) {
        setRequests(result.data.requests)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('リクエスト取得エラー:', error)
      toast.error('リクエストの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  /**
   * リクエスト承認ハンドラー
   */
  const handleAccept = async (
    requestId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await acceptConnectionRequest(requestId)

      if (result.success) {
        toast.success('つながりが成立しました！')
        // リクエストを一覧から削除
        setRequests((prev) => prev.filter((r) => r.id !== requestId))
        return { success: true, message: result.message }
      } else {
        toast.error(result.message)
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error('承認エラー:', error)
      toast.error('承認中にエラーが発生しました')
      return { success: false, message: '承認中にエラーが発生しました' }
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">つながりリクエスト</h1>
        <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">つながりリクエスト</h1>

      {requests.length === 0 ? (
        <div
          data-testid="no-requests"
          className="text-center py-12 text-muted-foreground"
        >
          <p>リクエストはありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={handleAccept}
            />
          ))}
        </div>
      )}
    </div>
  )
}
