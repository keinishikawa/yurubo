/**
 * ファイル名: error.tsx
 *
 * 【概要】
 * Next.js 15 App Routerのエラーバウンダリ
 * ランタイムエラーをキャッチし、ユーザーフレンドリーなエラー画面を表示
 *
 * 【処理フロー】
 * 1. エラーが発生するとこのコンポーネントが表示される
 * 2. エラー内容をコンソールに記録
 * 3. ユーザーにエラーメッセージと回復アクションを提示
 * 4. リトライボタンで再レンダリングを試行
 *
 * 【主要機能】
 * - ランタイムエラーのキャッチ
 * - エラーログ記録
 * - ユーザーフレンドリーなエラー表示
 * - リトライ機能
 *
 * 【依存関係】
 * - React Error Boundary: Next.jsの組み込み機能
 * - @/components/ui/button: ボタンコンポーネント
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * エラーバウンダリコンポーネント
 *
 * @param error - キャッチされたエラーオブジェクト
 * @param reset - エラーバウンダリをリセットして再レンダリングする関数
 * @returns エラー画面UI
 *
 * 【処理内容】
 * 1. エラー発生時にuseEffectでコンソールログに記録
 * 2. ユーザーにエラーメッセージを表示
 * 3. リトライボタンでreset()を呼び出して再レンダリング
 *
 * 【使用例】
 * このコンポーネントはNext.jsによって自動的に使用されます
 * app/配下でエラーが発生すると自動的にこのコンポーネントが表示されます
 *
 * 【注意】
 * - 'use client'ディレクティブ必須（Client Component）
 * - Server Componentsのエラーもキャッチ可能
 * - 本番環境ではエラー詳細を隠す（セキュリティ対策）
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  /**
   * エラーログ記録
   *
   * 【処理】
   * - エラー発生時にコンソールログに記録
   * - 本番環境ではエラー監視サービス（Sentry等）に送信することを推奨
   */
  useEffect(() => {
    // エラーログ記録（開発環境）
    console.error('Error caught by error boundary:', error)

    // TODO: 本番環境ではエラー監視サービスに送信
    // Example: Sentry.captureException(error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        {/* エラーアイコン */}
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* エラータイトル */}
        <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>

        {/* エラーメッセージ */}
        <p className="text-muted-foreground mb-8">
          申し訳ございません。予期しないエラーが発生しました。
          <br />
          もう一度お試しいただくか、問題が解決しない場合はサポートにお問い合わせください。
        </p>

        {/* 開発環境のみ: エラー詳細表示 */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-8 text-left">
            <summary className="cursor-pointer text-sm font-medium mb-2">
              エラー詳細（開発環境のみ表示）
            </summary>
            <div className="bg-muted p-4 rounded-md text-sm font-mono overflow-auto max-h-40">
              <p className="text-red-600">{error.message}</p>
              {error.digest && <p className="text-muted-foreground mt-2">Digest: {error.digest}</p>}
            </div>
          </details>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => reset()} variant="default">
            もう一度試す
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline">
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  )
}
