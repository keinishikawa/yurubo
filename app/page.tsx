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

"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createEvent } from "@/app/actions/createEvent";
import { signOut } from "@/app/actions/signOut";
import { getConnectionCount } from "@/lib/services/connection.service";
import { PostEventModal } from "@/components/events/PostEventModal";
import { FloatingPostButton } from "@/components/layout/FloatingPostButton";
import { EventTimeline } from "@/components/events/EventTimeline";
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
import type { CreateEventInput } from "@/lib/validation/event.schema";

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
 * - タイムライン自動更新はkeyを変更することで実現
 */
export default function HomePage() {
  // 【ステップ1】モーダルの開閉状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 【ステップ2】ローディング状態管理
  const [isCreating, setIsCreating] = useState(false);

  // 【ステップ2.5】タイムライン再読み込み用のキー
  const [timelineKey, setTimelineKey] = useState(0);

  // 【ステップ2.6】ログアウト処理中の状態管理 (T161)
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 【ステップ2.7】ログアウト確認ダイアログの状態管理 (T174)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // 【ステップ2.8】現在のユーザーID取得 (US3)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // 【ステップ2.9】つながりリスト数の状態管理 (FR-019)
  const [connectionCount, setConnectionCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    const fetchUserData = async () => {
      // ユーザーID取得
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // つながりリスト数を取得 (FR-019)
      const result = await getConnectionCount(supabase);
      if (result.error === null) {
        setConnectionCount(result.count);
      } else {
        setConnectionCount(0);
      }
    };
    fetchUserData();
  }, []);

  // 【ステップ3】イベント作成ハンドラー
  const handleCreateEvent = async (data: CreateEventInput) => {
    try {
      // ローディング開始 (T060)
      setIsCreating(true);

      // Server Action呼び出し (T058)
      const result = await createEvent(data);

      if (result.success) {
        // 成功時の処理 (T059)
        toast.success(result.message);

        // モーダルを閉じる
        setIsModalOpen(false);

        // タイムラインを再読み込み
        setTimelineKey((prev) => prev + 1);
      } else {
        // エラー時の処理 (T059)
        toast.error(result.message, {
          description: `エラーコード: ${result.code}`,
        });
      }
    } catch (error) {
      // 予期しないエラー
      console.error("イベント作成エラー:", error);
      toast.error(
        `予期しないエラー: ${error instanceof Error ? error.message : JSON.stringify(error)}`
      );
    } finally {
      // ローディング終了 (T060)
      setIsCreating(false);
    }
  };

  // 【ステップ4】ログアウトハンドラー (T161, T174)
  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      setShowLogoutDialog(false); // ダイアログを閉じる

      const result = await signOut();

      // エラー時のみ処理（成功時は自動的に/welcomeにリダイレクト）
      if (!result.success) {
        toast.error(result.message, {
          description: `エラーコード: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("ログアウトエラー:", error);
      toast.error("ログアウトに失敗しました。再度お試しください。");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="container mx-auto min-h-screen p-4">
      {/* ヘッダー (T161: ログアウトボタン追加) */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">タイムライン</h1>
          <p className="text-muted-foreground">つながりリストのイベントが表示されます</p>
        </div>
        <Button variant="outline" onClick={() => setShowLogoutDialog(true)} disabled={isLoggingOut}>
          {isLoggingOut ? "ログアウト中..." : "ログアウト"}
        </Button>
      </header>

      {/* ログアウト確認ダイアログ (T174) */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              ログアウトすると、次回アクセス時に新しい匿名ユーザーとして登録されます。
              <br />
              <span className="font-semibold text-destructive">
                現在のイベント投稿・つながりリストは引き継がれません。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? "ログアウト中..." : "ログアウト"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* タイムライン表示 (User Story 2) */}
      <div className="mb-24">
        <EventTimeline key={timelineKey} currentUserId={currentUserId} />
      </div>

      {/* 投稿ボタン（右下固定） */}
      <FloatingPostButton onClick={() => setIsModalOpen(true)} />

      {/* 投稿モーダル (T058) */}
      <PostEventModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateEvent}
        isLoading={isCreating}
        connectionCount={connectionCount}
      />
    </main>
  );
}
