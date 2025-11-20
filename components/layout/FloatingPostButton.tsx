/**
 * ファイル名: FloatingPostButton.tsx
 *
 * 【概要】
 * 画面右下に固定表示される「＋投稿」ボタン
 * クリックするとイベント投稿モーダルが開く
 *
 * 【処理フロー】
 * 1. 画面右下に固定配置（position: fixed）
 * 2. クリック時にonClickコールバックを呼び出し
 * 3. モバイルフレンドリーな大きさとタップ領域を確保
 *
 * 【主要機能】
 * - 固定配置ボタン（右下）
 * - ホバー・フォーカス時のアニメーション
 * - アクセシビリティ対応（aria-label）
 *
 * 【依存関係】
 * - shadcn-ui Button: ベースコンポーネント
 * - spec.md FR-001: 投稿ボタン表示要件
 */

'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * FloatingPostButtonのProps型
 */
type FloatingPostButtonProps = {
  onClick: () => void
}

/**
 * FloatingPostButtonコンポーネント
 *
 * @param props - クリックハンドラーを含むProps
 * @returns 画面右下に固定表示される投稿ボタン
 *
 * 【処理内容】
 * 1. position: fixedで画面右下に配置
 * 2. クリック時にonClickコールバックを呼び出し
 * 3. Plusアイコンと「投稿」テキストを表示
 *
 * 【UI仕様】
 * - 配置: 画面右下（右16px、下16px）
 * - サイズ: モバイルでもタップしやすい大きさ
 * - z-index: 50（他要素の上に表示）
 * - シャドウ: shadow-lg（浮遊感を演出）
 *
 * 【使用例】
 * <FloatingPostButton onClick={() => setIsModalOpen(true)} />
 *
 * 【設計根拠】
 * spec.md FR-001: ホーム画面右下の「＋投稿」ボタン
 *
 * 【アクセシビリティ】
 * - aria-label: スクリーンリーダー対応
 * - キーボード操作可能（Buttonコンポーネント標準機能）
 */
export function FloatingPostButton({ onClick }: FloatingPostButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-4 right-4 z-50 h-14 gap-2 rounded-full px-6 shadow-lg transition-transform hover:scale-105"
      aria-label="イベントを投稿"
    >
      <Plus className="h-5 w-5" />
      <span className="font-semibold">投稿</span>
    </Button>
  )
}
