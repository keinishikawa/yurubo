/**
 * ファイル名: page.tsx
 *
 * 【概要】
 * ホーム画面（タイムライン）のメインページ
 * イベント一覧表示と投稿機能を統合
 *
 * 【処理フロー】
 * 1. FloatingPostButtonをクリックするとPostEventModalが開く
 * 2. モーダルからイベント作成Server Actionを呼び出し
 * 3. 成功時はToast通知を表示
 * 4. エラー時はエラーメッセージをToastで表示
 *
 * 【主要機能】
 * - イベント投稿モーダル表示
 * - イベント作成処理
 * - Toast通知（成功・エラー）
 * - ローディング状態管理
 *
 * 【依存関係】
 * - @/app/actions/createEvent: Server Action
 * - @/components/events/PostEventModal: 投稿モーダル
 * - @/components/layout/FloatingPostButton: 投稿ボタン
 * - sonner: Toast通知
 * - spec.md FR-001: 投稿機能統合要件
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createEvent } from '@/app/actions/createEvent'
import { PostEventModal } from '@/components/events/PostEventModal'
import { FloatingPostButton } from '@/components/layout/FloatingPostButton'
import type { CreateEventInput } from '@/lib/validation/event.schema'

/**
 * ホームページコンポーネント
 *
 * @returns タイムライン画面（投稿機能統合）
 *
 * 【処理内容】
 * 1. モーダルの開閉状態を管理
 * 2. 投稿処理中のローディング状態を管理
 * 3. フォーム送信時にcreateEvent Server Actionを呼び出し
 * 4. 成功時はToast通知を表示してモーダルを閉じる
 * 5. エラー時はToast通知でエラーメッセージを表示
 *
 * 【UI構成】
 * - FloatingPostButton: 画面右下の「＋投稿」ボタン
 * - PostEventModal: イベント投稿モーダル
 * - Toast: 成功・エラー通知
 *
 * 【設計根拠】
 * spec.md FR-001: 匿名イベント投稿機能
 * spec.md FR-006: 投稿完了後、即座にタイムライン反映
 * spec.md NFR-003: 統一されたエラーハンドリング
 *
 * 【注意】
 * - タイムライン表示機能はUser Story 2で実装予定
 * - 現在はイベント投稿機能のみ実装
 */
export default function HomePage() {
  // 【ステップ1】モーダルの開閉状態管理
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 【ステップ2】ローディング状態管理
  const [isCreating, setIsCreating] = useState(false)

  // 【ステップ3】イベント作成ハンドラー
  const handleCreateEvent = async (data: CreateEventInput) => {
    try {
      // ローディング開始 (T060)
      setIsCreating(true)

      // Server Action呼び出し (T058)
      const result = await createEvent(data)

      if (result.success) {
        // 成功時の処理 (T059)
        toast.success(result.message, {
          description: `匿名ID: ${result.data?.anon_id}`,
        })

        // モーダルを閉じる
        setIsModalOpen(false)

        // TODO: タイムラインを再読み込み（User Story 2で実装）
      } else {
        // エラー時の処理 (T059)
        toast.error(result.message, {
          description: `エラーコード: ${result.code}`,
        })
      }
    } catch (error) {
      // 予期しないエラー
      console.error('イベント作成エラー:', error)
      toast.error('予期しないエラーが発生しました。もう一度お試しください。')
    } finally {
      // ローディング終了 (T060)
      setIsCreating(false)
    }
  }

  return (
    <main className="container mx-auto min-h-screen p-4">
      {/* ヘッダー */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">タイムライン</h1>
        <p className="text-muted-foreground">
          つながりリストのイベントが表示されます
        </p>
      </header>

      {/* TODO: タイムライン表示（User Story 2で実装） */}
      <div className="mb-24 space-y-4">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            タイムライン機能はUser Story 2で実装予定です
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            現在はイベント投稿機能のみ利用可能です
          </p>
        </div>
      </div>

      {/* 投稿ボタン（右下固定） */}
      <FloatingPostButton onClick={() => setIsModalOpen(true)} />

      {/* 投稿モーダル (T058) */}
      <PostEventModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateEvent}
        isLoading={isCreating}
      />
    </main>
  )
}
