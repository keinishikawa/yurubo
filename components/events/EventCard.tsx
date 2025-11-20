/**
 * ファイル名: EventCard.tsx
 *
 * 【概要】
 * タイムラインに表示されるイベントカードコンポーネント
 * イベントの基本情報を匿名IDと共に表示する
 *
 * 【処理フロー】
 * 1. イベントデータをpropsで受け取る
 * 2. カテゴリに応じた絵文字を表示
 * 3. 開催日時、想定人数、価格帯、コメント、匿名IDを表示
 * 4. 投稿者の実名は一切表示しない（匿名性保証）
 *
 * 【主要機能】
 * - イベント情報の視覚的表示
 * - カテゴリ絵文字アイコン
 * - 匿名ID表示（🍶A形式）
 *
 * 【依存関係】
 * - @/lib/utils/generateAnonId: カテゴリ絵文字取得
 * - spec.md FR-011: イベントカード表示要件
 */

'use client'

import { getCategoryEmoji } from '@/lib/utils/generateAnonId'

/**
 * イベントカード表示用の型定義
 *
 * 【用途】EventCardコンポーネントのProps型
 * 【データソース】Supabase eventsテーブル
 *
 * 【フィールド】
 * - id: イベント一意ID
 * - anon_id: 匿名ID（例: 🍶A）
 * - category: イベントカテゴリ
 * - title: イベントタイトル
 * - date_start: 開始日時（ISO 8601形式）
 * - date_end: 終了日時（ISO 8601形式）
 * - capacity_min: 最小参加人数
 * - capacity_max: 最大参加人数
 * - price_min: 最小予算（任意）
 * - price_max: 最大予算（任意）
 * - comment: コメント（任意）
 */
export type EventCardData = {
  id: string
  anon_id: string
  category: string
  title: string
  date_start: string
  date_end: string
  capacity_min: number
  capacity_max: number
  price_min: number | null
  price_max: number | null
  comment: string | null
}

/**
 * EventCardコンポーネントのProps
 */
type EventCardProps = {
  event: EventCardData
}

/**
 * 日時フォーマット関数
 *
 * @param dateString - ISO 8601形式の日時文字列
 * @returns 日本語表記の日時（例: 12/01（日）19:00）
 *
 * 【処理内容】
 * 1. Date オブジェクトに変換
 * 2. 日本語ロケールでフォーマット
 * 3. 月/日（曜日）時:分 形式で返却
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month}/${day}（${weekday}）${hours}:${minutes}`
}

/**
 * 価格帯フォーマット関数
 *
 * @param priceMin - 最小予算
 * @param priceMax - 最大予算
 * @returns フォーマット済み価格帯文字列（例: 3,000~5,000円）
 *
 * 【処理内容】
 * 1. 両方nullの場合は「未設定」を返す
 * 2. 片方のみnullの場合は設定済みの方を返す
 * 3. 両方設定されている場合は「最小~最大円」形式で返す
 * 4. 3桁区切りカンマを追加
 */
function formatPriceRange(
  priceMin: number | null,
  priceMax: number | null
): string {
  if (priceMin == null && priceMax == null) {
    return '未設定'
  }
  if (priceMin == null) {
    return `〜${priceMax?.toLocaleString()}円`
  }
  if (priceMax == null) {
    return `${priceMin.toLocaleString()}円〜`
  }
  return `${priceMin.toLocaleString()}〜${priceMax.toLocaleString()}円`
}

/**
 * EventCardコンポーネント
 *
 * @param props - イベントデータを含むProps
 * @returns タイムラインに表示されるイベントカード
 *
 * 【処理内容】
 * 1. propsからイベントデータを取得
 * 2. カテゴリ絵文字を取得（getCategoryEmoji）
 * 3. 日時・価格帯をフォーマット
 * 4. カード形式でUIを表示
 *
 * 【UI構成】
 * - ヘッダー: カテゴリ絵文字 + 匿名ID
 * - ボディ:
 *   - 開催日時（開始〜終了）
 *   - 想定人数（最小〜最大人）
 *   - 価格帯（オプション）
 *   - コメント（オプション）
 *
 * 【設計根拠】
 * spec.md FR-011: イベントカード表示要件
 * spec.md FR-005: 匿名ID表示（実名非表示）
 *
 * 【注意】
 * - 投稿者の実名は一切表示しない（匿名性保証）
 * - price_min/price_max/commentはnullの可能性あり
 */
export function EventCard({ event }: EventCardProps) {
  // 【データ準備】カテゴリ絵文字を取得
  const categoryEmoji = getCategoryEmoji(event.category)

  // 【データ準備】日時フォーマット
  const startDateTime = formatDateTime(event.date_start)
  const endDateTime = formatDateTime(event.date_end)

  // 【データ準備】価格帯フォーマット
  const priceRange = formatPriceRange(event.price_min, event.price_max)

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {/* ヘッダー: カテゴリ絵文字 + 匿名ID */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{categoryEmoji}</span>
        <span className="text-sm font-medium text-muted-foreground">
          {event.anon_id}
        </span>
      </div>

      {/* タイトル */}
      <h3 className="mb-3 text-lg font-semibold">{event.title}</h3>

      {/* イベント詳細 */}
      <div className="space-y-2 text-sm">
        {/* 開催日時 */}
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground">📅</span>
          <div>
            <div>{startDateTime}</div>
            <div className="text-muted-foreground">〜 {endDateTime}</div>
          </div>
        </div>

        {/* 想定人数 */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">👥</span>
          <span>
            {event.capacity_min}〜{event.capacity_max}人
          </span>
        </div>

        {/* 価格帯（オプション） */}
        {(event.price_min != null || event.price_max != null) && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">💰</span>
            <span>{priceRange}</span>
          </div>
        )}

        {/* コメント（オプション） */}
        {event.comment && (
          <div className="mt-3 rounded bg-muted p-2">
            <p className="text-sm">{event.comment}</p>
          </div>
        )}
      </div>
    </div>
  )
}
