/**
 * ファイル名: page.tsx (Welcome Screen)
 *
 * 【概要】
 * 簡易登録画面（WelcomeScreen） - User Story 4 (T156-T158, T162)
 *
 * 【主要機能】
 * - T156: WelcomeScreen作成
 * - T157: 表示名入力フォーム
 * - T158: ローディング・エラーハンドリング
 * - T162: クライアントサイドでSupabase匿名認証を実行
 *
 * 【処理フロー】
 * 1. 「ゆるぼへようこそ」メッセージ表示
 * 2. 表示名入力フィールド
 * 3. 「はじめる」ボタンクリック → クライアント側でSupabase認証
 * 4. 成功時は自動的にタイムライン画面にリダイレクト
 * 5. 失敗時はエラーメッセージ表示
 *
 * 【依存関係】
 * - lib/supabase/client: クライアントサイドSupabase
 * - lib/validation/user.schema: バリデーションスキーマ
 * - shadcn-ui: Button, Input, Card
 *
 * @see specs/001-event-creation/spec.md - User Story 4 受入シナリオ1,2
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createUserProfileSchema } from '@/lib/validation/user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function WelcomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 「はじめる」ボタンクリック時の処理
   *
   * 【処理フロー】
   * 1. クライアント側でSupabase匿名認証を実行
   * 2. usersテーブルにプロフィールを作成
   * 3. 成功時はタイムライン画面にリダイレクト
   * 4. 失敗時はエラーメッセージを表示
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: 表示名のバリデーション
      const validationResult = createUserProfileSchema.safeParse({
        display_name: displayName,
      });

      if (!validationResult.success) {
        setError(validationResult.error.issues[0].message);
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      // Step 2: Supabase匿名サインイン
      const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();

      if (signInError || !authData.user) {
        setError('サインインに失敗しました。再度お試しください。');
        setIsLoading(false);
        return;
      }

      // Step 3: usersテーブルにプロフィールを作成
      const { error: profileError } = await supabase.from('users').upsert({
        id: authData.user.id,
        display_name: validationResult.data.display_name,
        enabled_categories: validationResult.data.enabled_categories,
        notification_preferences: validationResult.data.notification_preferences,
      });

      if (profileError) {
        // プロフィール作成失敗時は認証もロールバック
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error('Failed to rollback authentication:', signOutError);
        }
        setError('ユーザー情報の保存に失敗しました。再度お試しください。');
        setIsLoading(false);
        return;
      }

      // Step 4: タイムライン画面にリダイレクト
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('予期しないエラーが発生しました。再度お試しください。');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ゆるぼへようこそ</CardTitle>
          <CardDescription>
            表示名を入力してはじめましょう
            <br />
            メールアドレスは不要です
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* 表示名入力フィールド (T157) */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                表示名 <span className="text-destructive">*</span>
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="例: ゆるぼ太郎"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">1〜50文字で入力してください</p>
            </div>

            {/* エラーメッセージ表示 (T158) */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !displayName.trim()}>
              {isLoading ? '処理中...' : 'はじめる'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
