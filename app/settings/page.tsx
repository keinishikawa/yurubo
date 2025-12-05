/**
 * ファイル名: page.tsx
 *
 * 【概要】
 * 設定ページ
 * ユーザー設定、プロフィール編集、つながりリスト管理を統合
 *
 * 【処理フロー】
 * 1. 現在のユーザー情報を取得
 * 2. タブ形式でセクションを切り替え（プロフィール、つながり、その他設定）
 * 3. ログアウト機能を提供
 *
 * 【主要機能】
 * - プロフィール編集（表示名、プロフィール画像など）
 * - つながりリスト管理（追加・削除・カテゴリ設定）
 * - ログアウト機能
 *
 * 【依存関係】
 * - @/lib/supabase/client: クライアントサイドSupabase
 * - @/components/ui/*: UIコンポーネント
 * - CLAUDE.md セクション14: フロントエンドデザインガイドライン
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

/**
 * 設定ページコンポーネント
 *
 * @returns 設定画面
 *
 * 【処理内容】
 * 1. useEffectで現在のユーザー情報を取得
 * 2. タブでセクションを切り替え
 * 3. 各セクションで設定を管理
 *
 * 【UI構成】
 * - ヘッダー（タイトル・説明）
 * - タブコンポーネント（プロフィール、つながり、その他）
 * - ログアウトボタン
 *
 * 【デザイン方針】
 * - YURUBOの「親しみやすさ、カジュアルさ、使いやすさ」を表現
 * - レスポンシブデザイン対応
 * - アクセシビリティ対応
 *
 * 【注意】
 * - 将来的にプロフィール編集機能とつながりリスト管理機能を実装予定
 * - 現在はログアウト機能のみ実装
 */
export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; display_name: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // ユーザー情報を取得
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (userData) {
          setCurrentUser(userData);
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("ログアウトに失敗しました");
      console.error("ログアウトエラー:", error);
    } else {
      toast.success("ログアウトしました");
      router.push("/welcome");
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto min-h-screen p-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-screen p-4" data-testid="settings-page">
      {/* ヘッダー */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">設定</h1>
        <p className="text-muted-foreground">プロフィール、つながり、その他の設定を管理</p>
      </header>

      {/* タブコンテンツ */}
      <Tabs defaultValue="profile" className="mb-24">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="connections">つながり</TabsTrigger>
          <TabsTrigger value="other">その他</TabsTrigger>
        </TabsList>

        {/* プロフィールタブ */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール編集</CardTitle>
              <CardDescription>表示名やプロフィール画像を変更できます</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">表示名</p>
                <p className="text-muted-foreground">
                  {currentUser?.display_name || "未設定"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                ※プロフィール編集機能は今後実装予定です
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* つながりタブ */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>つながりリスト管理</CardTitle>
              <CardDescription>
                つながりのあるユーザーを管理し、カテゴリ設定を変更できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Link href="/connections/search">
                  <Button variant="outline" className="w-full justify-start">
                    友人を検索・追加
                  </Button>
                </Link>
                <Link href="/connections/requests">
                  <Button variant="outline" className="w-full justify-start">
                    受信リクエスト一覧
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                ※つながりリスト一覧は今後実装予定です
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* その他タブ */}
        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>その他の設定</CardTitle>
              <CardDescription>アカウント管理やアプリの設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">ログアウト</p>
                  <p className="text-sm text-muted-foreground">
                    アプリからログアウトします
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  data-testid="logout-button"
                >
                  ログアウト
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
