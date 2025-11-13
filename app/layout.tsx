/**
 * ファイル名: layout.tsx
 *
 * 【概要】
 * Next.js 15 App Routerのルートレイアウト
 * 全ページ共通のHTML構造、メタデータ、ナビゲーションを提供
 *
 * 【処理フロー】
 * 1. フォント設定（Geist Sans, Geist Mono）
 * 2. メタデータ設定（title, description）
 * 3. HTML/body構造の定義
 * 4. ナビゲーションバーの配置
 * 5. Toaster（通知）コンポーネントの配置
 *
 * 【主要機能】
 * - グローバルフォント設定
 * - SEOメタデータ
 * - レスポンシブナビゲーション
 * - トースト通知機能
 *
 * 【依存関係】
 * - next/font/google: Google Fonts読み込み
 * - @/components/ui/sonner: Toast通知
 * - ./globals.css: Tailwind CSSスタイル
 */

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

/**
 * Geist Sans フォント設定
 *
 * 【用途】本文・UI要素のフォント
 * 【特徴】可読性の高いサンセリフフォント
 */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

/**
 * Geist Mono フォント設定
 *
 * 【用途】コード表示用フォント
 * 【特徴】等幅フォント
 */
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * メタデータ設定
 *
 * 【用途】SEO、SNSシェア時のメタ情報
 * 【設計根拠】spec.md プロジェクト概要
 */
export const metadata: Metadata = {
  title: 'ゆるぼ - 匿名型イベント調整プラットフォーム',
  description: '人間関係の「誘う・断る」摩擦をゼロに。匿名でイベントを投稿し、つながりリストで配信先を制御。',
}

/**
 * ルートレイアウトコンポーネント
 *
 * @param children - 子コンポーネント（各ページ）
 * @returns 全ページ共通のレイアウト
 *
 * 【処理内容】
 * 1. HTML lang属性を日本語（ja）に設定
 * 2. bodyにフォント変数とTailwindクラスを適用
 * 3. ナビゲーションバーを配置
 * 4. メインコンテンツエリア（children）を配置
 * 5. Toasterを配置（トースト通知用）
 *
 * 【使用例】
 * このコンポーネントは自動的にすべてのページに適用されます
 * 各ページコンポーネントはchildrenとして渡されます
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ナビゲーションバー */}
        <nav className="border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            {/* ロゴ */}
            <Link href="/" className="text-xl font-bold">
              ゆるぼ
            </Link>

            {/* ナビゲーションリンク */}
            <div className="flex items-center gap-6">
              <Link href="/events" className="text-sm font-medium hover:underline">
                タイムライン
              </Link>
              <Link href="/connections" className="text-sm font-medium hover:underline">
                つながり
              </Link>
              <Link href="/profile" className="text-sm font-medium hover:underline">
                プロフィール
              </Link>
            </div>
          </div>
        </nav>

        {/* メインコンテンツ */}
        <main className="container mx-auto px-4 py-6">{children}</main>

        {/* トースト通知 */}
        <Toaster />
      </body>
    </html>
  )
}
