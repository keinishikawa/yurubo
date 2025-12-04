/**
 * ファイル名: auth.ts
 *
 * 【概要】
 * E2Eテスト用の認証ヘルパー関数
 * Mailpit APIを使用してMagic Linkを取得し、認証フローを自動化
 *
 * 【主要機能】
 * - Magic Linkを使った認証フロー
 * - MailpitからMagic Linkを取得
 * - セッション確立後のリダイレクト確認
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 * - Mailpit API: ローカルメールサーバー
 *
 * @see Issue #51 - Phase 0: 認証機能の修正
 */

import { Page, expect } from '@playwright/test';

/**
 * Mailpit APIのベースURL
 * ローカルSupabaseで使用されるMailpit
 */
const MAILPIT_API_URL = 'http://127.0.0.1:54324/api/v1';

/**
 * メールからMagic Linkを抽出
 *
 * @param emailBody - メール本文（HTML or プレーンテキスト）
 * @returns Magic LinkのURL（見つからない場合はnull）
 */
function extractMagicLink(emailBody: string): string | null {
  // Supabase Magic Linkのパターンを検索
  // Supabaseはverifyエンドポイント経由でリダイレクトする
  // 例: http://127.0.0.1:54321/auth/v1/verify?token=xxx&type=magiclink&redirect_to=...
  const linkPattern = /https?:\/\/[^\s<>"]+\/auth\/v1\/verify\?[^\s<>"]+/;
  const match = emailBody.match(linkPattern);
  if (match) {
    // HTMLエンティティをデコード（&amp; → &）
    return match[0].replace(/&amp;/g, '&');
  }
  return null;
}

/**
 * Mailpitから最新のメールを取得
 *
 * @param email - 検索対象のメールアドレス
 * @param maxRetries - 最大リトライ回数
 * @returns メール情報（見つからない場合はnull）
 */
async function getLatestEmail(
  email: string,
  maxRetries: number = 10
): Promise<{ id: string; subject: string } | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // メール一覧を取得
      const response = await fetch(`${MAILPIT_API_URL}/messages`);
      if (!response.ok) {
        console.log(`Mailpit API エラー: ${response.status}`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      const data = await response.json();
      const messages = data.messages || [];

      // 指定されたメールアドレス宛の最新メールを検索
      for (const message of messages) {
        const toAddresses = message.To || [];
        for (const to of toAddresses) {
          if (to.Address === email) {
            return { id: message.ID, subject: message.Subject };
          }
        }
      }
    } catch (error) {
      console.log(`Mailpit APIリクエストエラー:`, error);
    }

    // 少し待ってリトライ
    await new Promise((r) => setTimeout(r, 500));
  }

  return null;
}

/**
 * メールIDからメール本文を取得
 *
 * @param messageId - メールID
 * @returns メール本文
 */
async function getEmailBody(messageId: string): Promise<string> {
  const response = await fetch(`${MAILPIT_API_URL}/message/${messageId}`);
  if (!response.ok) {
    throw new Error(`メール取得エラー: ${response.status}`);
  }

  const data = await response.json();
  // HTML本文またはテキスト本文を返す
  return data.HTML || data.Text || '';
}

/**
 * Mailpitの全メールを削除
 */
async function clearAllEmails(): Promise<void> {
  try {
    await fetch(`${MAILPIT_API_URL}/messages`, { method: 'DELETE' });
  } catch (error) {
    console.log('メール削除エラー:', error);
  }
}

/**
 * Magic Link認証でサインイン
 *
 * @param page - Playwrightのページオブジェクト
 * @param email - ログイン用メールアドレス
 *
 * 【処理フロー】
 * 1. Cookieをクリア
 * 2. 既存のメールを削除
 * 3. /welcomeにアクセス
 * 4. メールアドレスを入力して送信
 * 5. MailpitからMagic Linkを取得
 * 6. Magic Linkにアクセス
 * 7. タイムライン画面を確認
 */
export async function signInWithMagicLink(page: Page, email?: string): Promise<void> {
  // テスト用のユニークなメールアドレスを生成
  const testEmail = email || `test-${Date.now()}@example.com`;

  // Step 1: Cookieをクリア
  await page.context().clearCookies();

  // Step 2: 既存のメールを削除
  await clearAllEmails();

  // Step 3: /welcomeにアクセス
  await page.goto('/welcome');
  await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible();

  // Step 4: 新規登録タブをクリック（テストは毎回新規ユーザーを作成）
  await page.locator('button[role="tab"]:has-text("新規登録")').click();

  // Step 5: メールアドレスを入力して送信
  await page.locator('input[type="email"]').fill(testEmail);
  await page.locator('button:has-text("登録リンクを送信")').click();

  // 送信完了を確認
  await expect(page.locator('text=メールを確認してください')).toBeVisible({ timeout: 10000 });

  // Step 5: MailpitからMagic Linkを取得
  const emailInfo = await getLatestEmail(testEmail);
  if (!emailInfo) {
    throw new Error(`メールが見つかりません: ${testEmail}`);
  }

  const emailBody = await getEmailBody(emailInfo.id);
  const magicLink = extractMagicLink(emailBody);
  if (!magicLink) {
    throw new Error(`Magic Linkが見つかりません。メール本文: ${emailBody.substring(0, 200)}`);
  }

  // Step 6: Magic Linkにアクセス
  await page.goto(magicLink);

  // Step 7: タイムライン画面を確認
  await expect(page.locator('h1:has-text("タイムライン")')).toBeVisible({ timeout: 10000 });
}

/**
 * テスト用の簡易サインイン（既存テストとの互換性用）
 *
 * @param page - Playwrightのページオブジェクト
 * @param displayName - 表示名（メールアドレスの識別子として使用）
 *
 * 【注意】
 * displayNameは英数字に変換されてメールアドレスのローカル部分として使用されます
 * 例: "テストユーザー" → "test-user-12345@example.com"
 */
export async function signIn(page: Page, displayName: string): Promise<void> {
  // 日本語を除去し、英数字のみを残す。空になった場合はデフォルト値を使用
  const sanitizedName = displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'testuser';
  const email = `${sanitizedName}-${Date.now()}@example.com`;

  await signInWithMagicLink(page, email);
}
