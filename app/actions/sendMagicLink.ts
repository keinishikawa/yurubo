/**
 * ファイル名: sendMagicLink.ts
 *
 * 【概要】
 * Magic Link送信Server Action - Issue #51
 *
 * 【処理フロー】
 * 1. クライアントからメールアドレスとモードを受け取る
 * 2. モードに応じてメール存在チェック
 *    - signup: 未登録のみ許可
 *    - login: 登録済みのみ許可
 * 3. auth.service.tsのMagic Link送信機能を呼び出す
 * 4. 結果をクライアントに返す
 *
 * 【依存関係】
 * - lib/services/auth.service: 認証サービス
 * - Supabase Magic Link認証
 *
 * @see Issue #51 - Phase 0: 認証機能の修正（Magic Link認証への移行）
 */

'use server';

import { signInWithMagicLink } from '@/lib/services/auth.service';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

/**
 * 認証モードの型定義
 * - signup: 新規登録（未登録メールのみ許可）
 * - login: ログイン（登録済みメールのみ許可）
 */
export type AuthMode = 'signup' | 'login';

/**
 * Magic Link送信レスポンスの型定義
 */
export type SendMagicLinkResponse =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
      code: string;
    };

/**
 * メールアドレスが登録済みかチェック
 *
 * @param email - チェックするメールアドレス
 * @returns 登録済みの場合true
 */
async function checkEmailExists(email: string): Promise<boolean> {
  const supabase = createClient();

  // auth.usersテーブルから直接検索はできないため、
  // usersテーブル（プロフィール）でメールアドレスを検索
  // 注: Supabase Authでは同じメールで複数回signInWithOtpを呼ぶと
  // 既存ユーザーにログインするか、新規ユーザーを作成する
  // そのため、usersテーブルのemailカラムで確認する
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('メール存在チェックエラー:', error);
    return false;
  }

  return data !== null;
}

/**
 * Magic Link送信Server Action
 *
 * クライアントからメールアドレスとモードを受け取り、Magic Linkを送信する
 *
 * @param email - ユーザーのメールアドレス
 * @param mode - 認証モード（'signup' | 'login'）
 * @returns Magic Link送信結果
 *
 * 【使用例】
 * // 新規登録
 * const result = await sendMagicLink('user@example.com', 'signup');
 *
 * // ログイン
 * const result = await sendMagicLink('user@example.com', 'login');
 *
 * 【処理フロー】
 * 1. モードに応じてメール存在チェック
 * 2. 現在のURLからリダイレクト先を構築
 * 3. auth.service.tsのsignInWithMagicLink呼び出し
 * 4. 結果をクライアントに返す
 */
export async function sendMagicLink(
  email: string,
  mode: AuthMode = 'login'
): Promise<SendMagicLinkResponse> {
  // Step 1: モードに応じてメール存在チェック
  const emailExists = await checkEmailExists(email);

  if (mode === 'signup' && emailExists) {
    return {
      success: false,
      message: 'このメールアドレスは既に登録されています。ログインしてください。',
      code: 'EMAIL_ALREADY_EXISTS',
    };
  }

  if (mode === 'login' && !emailExists) {
    return {
      success: false,
      message: 'このメールアドレスは登録されていません。新規登録してください。',
      code: 'EMAIL_NOT_FOUND',
    };
  }

  // Step 2: リダイレクト先URLを構築
  // headersからoriginを取得してコールバックURLを構築
  const headersList = await headers();
  const origin = headersList.get('origin') || headersList.get('host') || '';
  const protocol = origin.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = origin.startsWith('http') ? origin : `${protocol}://${origin}`;
  const redirectUrl = `${baseUrl}/auth/callback`;

  // Step 3: auth.service.tsのMagic Link送信機能を呼び出す
  const result = await signInWithMagicLink(email, redirectUrl);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      code: result.code,
    };
  }

  // Step 4: 成功レスポンスを返す
  return {
    success: true,
    message: result.message,
  };
}
