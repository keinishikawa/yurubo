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
 * 5. 幹事の場合、編集・中止ボタンを表示
 *
 * 【主要機能】
 * - イベント情報の視覚的表示
 * - カテゴリ絵文字アイコン
 * - 匿名ID表示（🍶A形式）
 * - イベント編集・中止（幹事のみ）
 *
 * 【依存関係】
 * - @/lib/utils/generateAnonId: カテゴリ絵文字取得
 * - spec.md FR-011: イベントカード表示要件
 */

"use client";

import { useState } from "react";
import { getCategoryEmoji } from "@/lib/utils/generateAnonId";
import { Button } from "@/components/ui/button";
import { EventEditModal } from "./EventEditModal";
import { updateEvent } from "@/app/actions/updateEvent";
import { cancelEvent } from "@/app/actions/cancelEvent";
import type { CreateEventInput } from "@/lib/validation/event.schema";

/**
 * イベントカード表示用の型定義
 *
 * 【用途】EventCardコンポーネントのProps型
 * 【データソース】Supabase eventsテーブル
 *
 * 【フィールド】
 * - id: イベント一意ID
 * - host_id: 幹事ユーザーID
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
 * - status: イベントステータス（recruiting | cancelled | etc）
 */
export type EventCardData = {
  id: string;
  host_id: string;
  anon_id: string;
  category: string;
  title: string;
  date_start: string;
  date_end: string;
  capacity_min: number;
  capacity_max: number;
  price_min: number | null;
  price_max: number | null;
  comment: string | null;
  status: string;
};

/**
 * EventCardコンポーネントのProps
 */
type EventCardProps = {
  event: EventCardData;
  currentUserId?: string;
};

/**
 * 日時フォーマット関数
 *
 * @param dateString - ISO 8601形式の日時文字列
 * @returns 日本語表記の日時（例: 12/01（日）19:00）
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${month}/${day}（${weekday}）${hours}:${minutes}`;
}

/**
 * 価格帯フォーマット関数
 *
 * @param priceMin - 最小予算
 * @param priceMax - 最大予算
 * @returns フォーマット済み価格帯文字列（例: 3,000~5,000円）
 */
function formatPriceRange(priceMin: number | null, priceMax: number | null): string {
  if (priceMin == null && priceMax == null) {
    return "未設定";
  }
  if (priceMin == null) {
    return `〜${priceMax?.toLocaleString()}円`;
  }
  if (priceMax == null) {
    return `${priceMin.toLocaleString()}円〜`;
  }
  return `${priceMin.toLocaleString()}〜${priceMax.toLocaleString()}円`;
}

/**
 * EventCardコンポーネント
 */
export function EventCard({ event, currentUserId }: EventCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 【データ準備】カテゴリ絵文字を取得
  const categoryEmoji = getCategoryEmoji(event.category);

  // 【データ準備】日時フォーマット
  const startDateTime = formatDateTime(event.date_start);
  const endDateTime = formatDateTime(event.date_end);

  // 【データ準備】価格帯フォーマット
  const priceRange = formatPriceRange(event.price_min, event.price_max);

  // 幹事かどうか判定
  const isHost = currentUserId === event.host_id;
  const isCancelled = event.status === "cancelled";

  const handleUpdate = async (eventId: string, data: CreateEventInput) => {
    setIsUpdating(true);
    try {
      const result = await updateEvent(eventId, data);
      if (result.success) {
        // 成功時の処理
        alert("イベントを更新しました");
        // TODO: 画面更新（router.refresh()など）
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("本当にイベントを中止しますか？この操作は取り消せません。")) return;

    try {
      const result = await cancelEvent(event.id);
      if (result.success) {
        alert("イベントを中止しました");
        // TODO: 画面更新
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    }
  };

  return (
    <div
      className={`rounded-lg border bg-card p-4 shadow-sm ${isCancelled ? "opacity-60 bg-gray-100" : ""}`}
    >
      {/* ヘッダー: カテゴリ絵文字 + 匿名ID + アクション */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryEmoji}</span>
          <span className="text-sm font-medium text-muted-foreground">{event.anon_id}</span>
          {isCancelled && (
            <span className="text-xs font-bold text-red-500 border border-red-500 px-1 rounded">
              中止
            </span>
          )}
        </div>

        {isHost && !isCancelled && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              編集
            </Button>
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              中止
            </Button>
          </div>
        )}
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

      <EventEditModal
        event={event}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleUpdate}
        isLoading={isUpdating}
      />
    </div>
  );
}
