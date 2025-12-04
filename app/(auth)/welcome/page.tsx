/**
 * ファイル名: page.tsx (Welcome Screen)
 *
 * 【概要】
 * ログイン/新規登録画面 - Magic Link認証
 *
 * 【主要機能】
 * - 新規登録タブ: 未登録メールのみ許可
 * - ログインタブ: 登録済みメールのみ許可
 * - Magic Link送信
 * - 送信完了メッセージ表示
 *
 * 【処理フロー】
 * 1. 「ゆるぼへようこそ」メッセージ表示
 * 2. 新規登録/ログインタブ切り替え
 * 3. メールアドレス入力フィールド
 * 4. 送信ボタンクリック → Magic Link送信（モードに応じたチェック）
 * 5. 成功時は「メールを確認してください」メッセージ表示
 * 6. 失敗時はエラーメッセージ表示
 *
 * 【依存関係】
 * - app/actions/sendMagicLink: Magic Link送信Server Action
 * - shadcn-ui: Button, Input, Card, Tabs
 *
 * @see Issue #51 - Phase 0: 認証機能の修正（Magic Link認証への移行）
 */

'use client';

import { useState } from 'react';
import { sendMagicLink, AuthMode } from '@/app/actions/sendMagicLink';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WelcomePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthMode>('login');

  /**
   * 送信ボタンクリック時の処理
   *
   * 【処理フロー】
   * 1. Server ActionでMagic Linkを送信（モード指定）
   * 2. 成功時は確認メッセージを表示
   * 3. 失敗時はエラーメッセージを表示
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Magic Link送信（モード指定）
      const result = await sendMagicLink(email, activeTab);

      if (!result.success) {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      // Step 2: 成功時は確認メッセージを表示
      setIsEmailSent(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Magic Link送信エラー:', err);
      setError('予期しないエラーが発生しました。再度お試しください。');
      setIsLoading(false);
    }
  };

  /**
   * タブ切り替え時の処理
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value as AuthMode);
    setError(null);
  };

  // メール送信完了画面
  if (isEmailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">メールを確認してください</CardTitle>
            <CardDescription>
              <span className="block mt-2">{email}</span>
              <span className="block mt-2">に{activeTab === 'signup' ? '登録' : 'ログイン'}リンクを送信しました。</span>
              <span className="block mt-2">メール内のリンクをクリックして{activeTab === 'signup' ? '登録を完了' : 'ログイン'}してください。</span>
            </CardDescription>
          </CardHeader>

          <CardFooter className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsEmailSent(false);
                setEmail('');
              }}
            >
              別のメールアドレスで試す
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // メールアドレス入力画面
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ゆるぼへようこそ</CardTitle>
          <CardDescription>
            メールアドレスで簡単にログインできます
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="login">ログイン</TabsTrigger>
            <TabsTrigger value="signup">新規登録</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="email-login" className="text-sm font-medium">
                    メールアドレス <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    登録済みのメールアドレスを入力してください
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
                  {isLoading ? '送信中...' : 'ログインリンクを送信'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="email-signup" className="text-sm font-medium">
                    メールアドレス <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    新しいメールアドレスを入力してください
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
                  {isLoading ? '送信中...' : '登録リンクを送信'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
