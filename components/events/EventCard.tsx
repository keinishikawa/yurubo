/**
 * ファイル名: EventCard.tsx
 *
 * 【概要】
 * タイムラインに表示されるイベントカードコンポーネント
 * イベントの基本情報を完全匿名で表示する
 *
 * 【処理フロー】
 * 1. イベントデータをpropsで受け取る
 * 2. カテゴリに応じた絵文字を表示
 * 3. 開催日時、想定人数、価格帯、コメントを表示
 * 4. 投稿者情報は一切表示しない（完全匿名）
 * 5. 幹事の場合、編集・中止ボタンを表示
 *
 * 【主要機能】
 * - イベント情報の視覚的表示
 * - カテゴリ絵文字アイコン
 * - 完全匿名表示（投稿者名非表示）
 * - イベント編集・中止（幹事のみ）
 *
 * 【依存関係】
 * - @/lib/utils/generateAnonId: カテゴリ絵文字取得
 * - spec.md FR-011: イベントカード表示要件
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getCategoryEmoji } from "@/lib/utils/generateAnonId";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onEventCancelled?: (eventId: string) => void;
  onEventUpdated?: (eventId: string, updatedData: CreateEventInput) => void;
};

/**
 * 日時フォーマット関数
 *
 * @param dateString - ISO 8601形式の日時文字列
 * @returns 日本語表記の日時（例: 12/01（日）19:00）
 */
/**
 * 日時フォーマット関数
 *
 * @param dateString - ISO 8601形式の日時文字列
 * @returns 日本語表記の日時（例: 12/01（日）19:00）
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

// カテゴリラベルのマッピング
const CATEGORY_LABELS: Record<string, string> = {
  drinking: "飲み",
  travel: "旅行",
  tennis: "テニス",
  other: "その他",
};

/**
 * EventCardコンポーネント
 */
export function EventCard({ event, currentUserId, onEventCancelled, onEventUpdated }: EventCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 【データ準備】カテゴリ絵文字を取得
  const categoryEmoji = getCategoryEmoji(event.category);
  const categoryLabel = CATEGORY_LABELS[event.category] || "その他";

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
        toast.success("イベントを更新しました");
        setIsEditModalOpen(false);
        // 親コンポーネントに更新を通知（リアルタイム更新が動作しない場合のフォールバック）
        if (onEventUpdated) {
          onEventUpdated(eventId, data);
        }
      } else {
        // エラーメッセージをトーストで表示
        toast.error(result.message || "イベントの更新に失敗しました");
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message) {
        // 既にServer Actionのエラーメッセージを表示済み
      } else {
        toast.error("エラーが発生しました");
      }
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelClick = () => {
    setIsCancelAlertOpen(true);
  };

  const handleCancelConfirm = async () => {
    try {
      const result = await cancelEvent(event.id);
      if (result.success) {
        toast.success("イベントを中止しました");
        if (onEventCancelled) {
          onEventCancelled(event.id);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    } finally {
      setIsCancelAlertOpen(false);
    }
  };

  return (
    <div
      className={`rounded-lg border bg-card p-4 shadow-sm ${isCancelled ? "opacity-60 bg-gray-100" : ""}`}
    >
      {/* 上段: タイトル・属性・アクション */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="space-y-1">
          {/* タイトル + カテゴリ（完全匿名） */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold leading-none">{event.title}</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              <span>{categoryEmoji}</span>
              <span>{categoryLabel}</span>
            </span>
            {isCancelled && (
              <span className="rounded border border-red-500 px-1 text-xs font-bold text-red-500">
                中止
              </span>
            )}
          </div>
        </div>

        {/* アクションボタン（幹事のみ） */}
        {isHost && !isCancelled && (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              data-testid="event-edit-button"
            >
              編集
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelClick}
              data-testid="event-cancel-button"
            >
              中止
            </Button>
          </div>
        )}
      </div>

      {/* 中段: イベント詳細（横並び） */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {/* 開催日時 */}
        <div className="flex items-center gap-1">
          <span>📅</span>
          <span>
            {startDateTime} 〜 {endDateTime.split("（")[1] || endDateTime}
          </span>
        </div>

        {/* 想定人数 */}
        <div className="flex items-center gap-1">
          <span>👥</span>
          <span>
            {event.capacity_min}〜{event.capacity_max}人
          </span>
        </div>

        {/* 価格帯 */}
        {(event.price_min != null || event.price_max != null) && (
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span>{priceRange}</span>
          </div>
        )}
      </div>

      {/* 下段: コメント */}
      {event.comment && <div className="rounded bg-muted p-2 text-sm">{event.comment}</div>}

      <EventEditModal
        event={event}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleUpdate}
        isLoading={isUpdating}
      />

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>イベントを中止しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。イベントはタイムラインから削除され、参加者に通知されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              中止する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
