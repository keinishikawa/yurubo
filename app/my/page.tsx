/**
 * ファイル名: page.tsx
 *
 * 【概要】
 * マイイベントページ（T105: User Story 3）
 * 自分が投稿したイベント一覧を表示し、編集・中止が可能
 *
 * 【処理フロー】
 * 1. 現在のユーザーIDを取得
 * 2. EventTimelineコンポーネントにhostIdフィルタを渡して自分のイベントのみ表示
 * 3. EventCardの編集・中止ボタンが表示される（既存機能: T106, T107）
 *
 * 【主要機能】
 * - 自分のイベント一覧表示
 * - 編集・中止ボタン表示
 * - 空状態メッセージ
 *
 * 【依存関係】
 * - @/components/events/EventTimeline: タイムライン表示
 * - @/lib/supabase/client: クライアントサイドSupabase
 * - spec.md User Story 3: イベント情報編集機能
 * - CLAUDE.md セクション14: フロントエンドデザインガイドライン
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventTimeline } from "@/components/events/EventTimeline";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * EmptyStateコンポーネント
 *
 * @returns 空状態UI（イベント未投稿時）
 *
 * 【デザイン方針】
 * - YURUBOの「ゆるい雰囲気」を表現
 * - ユーザーに次のアクションを促す
 */
function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center" data-testid="my-events-empty-state">
      <p className="text-lg text-muted-foreground">まだイベントを投稿していません</p>
      <p className="mt-2 text-sm text-muted-foreground">
        タイムライン画面の「＋投稿」ボタンから最初のイベントを作成してみましょう
      </p>
      <Link href="/">
        <Button variant="outline" className="mt-4">
          タイムラインに戻る
        </Button>
      </Link>
    </div>
  );
}

/**
 * マイイベントページコンポーネント
 *
 * @returns マイイベント画面
 *
 * 【処理内容】
 * 1. useEffectで現在のユーザーIDを取得
 * 2. EventTimelineコンポーネントにfilterByHostIdプロップを渡す
 * 3. 自分のイベントのみ表示される
 * 4. EventCardの編集・中止ボタンが常に表示される（T106完了済み）
 *
 * 【UI構成】
 * - ヘッダー（タイトル・説明・戻るボタン）
 * - EventTimeline（filterByHostId付き）
 * - 空状態メッセージ（イベントなし時）
 *
 * 【設計根拠】
 * spec.md T105: マイイベントページ作成
 * spec.md US3 シナリオ1: マイイベント画面でイベントカードをタップ→編集
 * CLAUDE.md セクション14: フロントエンドデザインガイドライン
 *
 * 【デザイン方針】
 * - YURUBOの「親しみやすさ、カジュアルさ、使いやすさ」を表現
 * - レスポンシブデザイン対応
 * - アクセシビリティ対応（data-testid属性）
 *
 * 【注意】
 * - EventTimelineコンポーネントを再利用することで実装を簡潔に保つ
 * - Server Componentではなく、Client Componentとして実装（useEffectでユーザーID取得）
 */
export default function MyEventsPage() {
  // 【ステップ1】現在のユーザーID取得
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <main className="container mx-auto min-h-screen p-4" data-testid="my-events-page">
      {/* ヘッダー */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">マイイベント</h1>
            <p className="text-muted-foreground">あなたが投稿したイベント一覧</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="back-to-timeline-button">
              タイムラインに戻る
            </Button>
          </Link>
        </div>
      </header>

      {/* マイイベント一覧 */}
      <div className="mb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : currentUserId ? (
          <EventTimeline
            currentUserId={currentUserId}
            filterByHostId={currentUserId}
            className="space-y-4"
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}
