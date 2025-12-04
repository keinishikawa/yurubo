/**
 * ファイル名: request-card.tsx
 *
 * 【概要】
 * つながりリクエストカードコンポーネント
 * 受信したリクエストを表示し、承認/拒否ボタンを提供
 *
 * 【処理フロー】
 * 1. リクエスト情報を表示
 * 2. 承認/拒否ボタンをクリック
 * 3. コールバックを呼び出し
 *
 * 【主要機能】
 * - 送信者情報表示（名前、アバター）
 * - リクエスト日時表示
 * - メッセージ表示
 * - 承認/拒否ボタン
 *
 * 【依存関係】
 * - @/components/ui/button: ボタンコンポーネント
 * - @/components/ui/card: カードコンポーネント
 *
 * @spec US2-1: リクエスト一覧ページで送信者名とリクエスト日時を表示
 * @spec US2-2: 承認後、つながりが成立しリクエスト一覧から消える
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
 * RequestCardコンポーネントのProps
 */
type RequestCardProps = {
  /** リクエスト情報 */
  request: ReceivedRequest
  /** 承認時のコールバック */
  onAccept: (requestId: string) => Promise<{ success: boolean; message: string }>
  /** 拒否時のコールバック（US2で実装） */
  onReject?: (requestId: string) => Promise<{ success: boolean; message: string }>
}

/**
 * 日時をフォーマットするヘルパー関数
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * つながりリクエストカードコンポーネント
 *
 * @param props - コンポーネントプロパティ
 * @returns リクエストカードUI
 *
 * @spec US2-1: リクエスト一覧ページで送信者名とリクエスト日時を表示
 */
export function RequestCard({ request, onAccept, onReject }: RequestCardProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  /**
   * 承認ハンドラー
   */
  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await onAccept(request.id)
    } finally {
      setIsAccepting(false)
    }
  }

  /**
   * 拒否ハンドラー
   */
  const handleReject = async () => {
    if (!onReject) return

    setIsRejecting(true)
    try {
      await onReject(request.id)
    } finally {
      setIsRejecting(false)
    }
  }

  const isProcessing = isAccepting || isRejecting

  return (
    <Card data-testid="request-card" className="p-4">
      <div className="flex items-start justify-between">
        {/* 送信者情報 */}
        <div className="flex items-center gap-3">
          {/* アバター */}
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {request.sender.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.sender.avatar_url}
                alt={request.sender.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-lg">
                {request.sender.display_name.charAt(0)}
              </span>
            )}
          </div>

          {/* 名前とメッセージ */}
          <div>
            <p className="font-medium">{request.sender.display_name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(request.created_at)}
            </p>
            {request.message && (
              <p className="text-sm mt-1 text-muted-foreground italic">
                &quot;{request.message}&quot;
              </p>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isProcessing}
            data-testid="accept-button"
          >
            {isAccepting ? '承認中...' : '承認'}
          </Button>
          {onReject && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isProcessing}
              data-testid="reject-button"
            >
              {isRejecting ? '拒否中...' : '拒否'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
