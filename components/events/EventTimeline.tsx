/**
 * ファイル名: EventTimeline.tsx
 *
 * 【概要】
 * タイムライン表示コンポーネント
 * 無限スクロールとローディングスケルトンを実装
 *
 * 【依存関係】
 * - React 19: useEffect, useCallback
 * - EventCard: イベントカード表示
 * - fetchTimeline: Server Action
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventCard } from "@/components/events/EventCard";
import { fetchTimeline } from "@/app/actions/fetchTimeline";
import type { Database } from "@/lib/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

/**
 * EventTimelineのProps型
 */
type EventTimelineProps = {
  /** 初期イベント一覧（SSR用） */
  initialEvents?: Event[];
  /** 追加のCSSクラス */
  className?: string;
  /** 現在のユーザーID（編集・中止権限判定用） */
  currentUserId?: string;
};

/**
 * ローディングスケルトンコンポーネント
 *
 * @returns スケルトンUI
 */
function EventSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border p-4">
      <div className="mb-2 h-4 w-1/4 rounded bg-muted"></div>
      <div className="mb-4 h-6 w-3/4 rounded bg-muted"></div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted"></div>
        <div className="h-4 w-2/3 rounded bg-muted"></div>
      </div>
    </div>
  );
}

/**
 * 空状態メッセージコンポーネント
 *
 * @returns 空状態UI
 */
function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <p className="text-lg text-muted-foreground">まだイベントがありません</p>
      <p className="mt-2 text-sm text-muted-foreground">
        右下の「＋投稿」ボタンからイベントを作成してみましょう
      </p>
    </div>
  );
}

/**
 * EventTimelineコンポーネント
 *
 * @param props - EventTimelineのProps
 * @returns タイムライン表示UI
 *
 * 【処理内容】
 * 1. 初期イベント一覧を表示
 * 2. スクロール位置を監視して無限スクロール実装
 * 3. ローディング中はスケルトンを表示
 * 4. イベントがない場合は空状態メッセージを表示
 *
 * 【UI仕様】
 * - EventCardを縦並びで表示
 * - スクロール末尾に到達すると次のページを自動読み込み
 * - 読み込み中はスケルトン表示
 * - 空の場合は案内メッセージ表示
 */
export function EventTimeline({
  initialEvents = [],
  className,
  currentUserId,
}: EventTimelineProps) {
  // 【ステップ1】状態管理
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [page, setPage] = useState(initialEvents.length > 0 ? 1 : 0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // スクロール監視用の参照
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 【ステップ2】次のページを読み込む関数
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchTimeline({ page, limit: 20 });

      if (result.success && result.data) {
        // 重複を防ぐため、既存のIDセットを作成
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = result.data!.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
        setHasMore(result.hasMore ?? false);
        setPage((prev) => prev + 1);
      } else {
        setError(result.message);
        setHasMore(false);
      }
    } catch (err) {
      console.error("タイムライン読み込みエラー:", err);
      setError("イベントの読み込みに失敗しました");
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  // 【ステップ3】Intersection Observerで無限スクロール実装
  useEffect(() => {
    if (!loadMoreRef.current) return;

    // Observerを作成
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    // 監視開始
    observerRef.current.observe(loadMoreRef.current);

    // クリーンアップ
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoading]);

  // 【ステップ4】初回ロード（initialEventsが空の場合）
  // React 19 Strict Modeでの二重実行を防ぐため、refで制御
  const isInitialLoadRef = useRef(false);

  useEffect(() => {
    // 既に初回ロード済みの場合はスキップ
    if (isInitialLoadRef.current) return;

    if (events.length === 0 && !isLoading && hasMore) {
      isInitialLoadRef.current = true;
      loadMore();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 【ステップ5】Supabase Realtimeでリアルタイム更新を実装（T092対応）
  useEffect(() => {
    const supabase = createClient();

    // eventsテーブルの変更を購読
    const channel = supabase
      .channel('events-timeline-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: 'status=eq.recruiting', // 募集中のイベントのみ
        },
        async (payload) => {
          // 新しいイベントをタイムラインの先頭に追加
          const newEvent = payload.new as Event;

          // つながりリストとカテゴリのフィルタリングを確認するため、
          // fetchTimelineを再度呼び出して、このイベントが含まれているか確認
          const result = await fetchTimeline({ page: 0, limit: 1 });

          if (!result.success || !result.data) {
            return;
          }

          // 最新のイベントが新規イベントと一致する場合のみ追加
          const latestEvent = result.data[0];
          if (latestEvent && latestEvent.id === newEvent.id) {
            setEvents((prev) => {
              // 重複チェック
              if (prev.some((e) => e.id === newEvent.id)) {
                return prev;
              }
              // 先頭に追加（新しいものが上）
              return [newEvent, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          const updatedEvent = payload.new as Event;
          setEvents((prev) =>
            prev.map((event) =>
              event.id === updatedEvent.id ? updatedEvent : event
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          const deletedEventId = payload.old.id as string;
          setEvents((prev) => prev.filter((event) => event.id !== deletedEventId));
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 【ステップ6】イベント中止時のハンドラー
  const handleEventCancelled = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
  }, []);

  return (
    <div className={className}>
      {/* イベント一覧 */}
      {events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={currentUserId}
              onEventCancelled={handleEventCancelled}
            />
          ))}
        </div>
      )}

      {/* ローディングスケルトン */}
      {isLoading && (
        <div className="mt-4 space-y-4">
          <EventSkeleton />
          <EventSkeleton />
          <EventSkeleton />
        </div>
      )}

      {/* 空状態メッセージ */}
      {events.length === 0 && !isLoading && <EmptyState />}

      {/* エラーメッセージ */}
      {error && (
        <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 無限スクロール用のトリガー要素 */}
      {hasMore && <div ref={loadMoreRef} className="h-10" />}

      {/* 末尾メッセージ */}
      {!hasMore && events.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          すべてのイベントを表示しました
        </p>
      )}
    </div>
  );
}
