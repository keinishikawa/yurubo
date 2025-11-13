/**
 * ファイル名: loading.tsx
 *
 * 【概要】
 * Next.js 15 App Routerのローディング状態UI
 * ページ遷移時やServer Componentsのデータ取得中に表示
 *
 * 【処理フロー】
 * 1. Next.jsが自動的にSuspense境界を作成
 * 2. データ取得中にこのコンポーネントを表示
 * 3. データ取得完了後に実際のページコンポーネントに切り替え
 *
 * 【主要機能】
 * - ローディングスピナー表示
 * - スケルトンスクリーン（オプション）
 * - ユーザーへの待機状態通知
 *
 * 【依存関係】
 * - React Suspense: Next.jsの組み込み機能
 */

/**
 * ローディングコンポーネント
 *
 * @returns ローディング画面UI
 *
 * 【処理内容】
 * 1. 画面中央にスピナーを表示
 * 2. アニメーションで回転
 * 3. アクセシビリティ対応（sr-only）
 *
 * 【使用例】
 * このコンポーネントはNext.jsによって自動的に使用されます
 * app/配下でasync Server Componentsがある場合、自動的に表示されます
 *
 * 【デザイン】
 * - 中央配置
 * - 回転アニメーション
 * - グレー系の色
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      {/* ローディングスピナー */}
      <div className="flex flex-col items-center gap-4">
        {/* スピナーアイコン */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>

        {/* ローディングテキスト */}
        <p className="text-sm text-muted-foreground">読み込み中...</p>

        {/* スクリーンリーダー用テキスト（アクセシビリティ） */}
        <span className="sr-only">ページを読み込んでいます。お待ちください。</span>
      </div>
    </div>
  )
}
