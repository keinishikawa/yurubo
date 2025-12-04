/**
 * ファイル名: auth.service.ts
 *
 * 【概要】
 * 認証サービス - Supabase Magic Link認証を使用した認証機能
 *
 * 【主要機能】
 * - signInWithMagicLink: Magic Link認証（メールアドレスでログイン）
 * - T150: セッション管理（check/refresh）
 * - T151: ログアウト
 *
 * 【依存関係】
 * - @supabase/supabase-js: Supabase クライアント
 * - user.schema: バリデーション
 *
 * @see Issue #51 - Phase 0: 認証機能の修正（Magic Link認証への移行）
 */

import { createClient } from '@/lib/supabase/server';

/**
 * 認証結果の型定義
 */
export type AuthResult =
  | {
      success: true;
      user: {
        id: string;
        display_name: string;
      };
    }
  | {
      success: false;
      error: 'VALIDATION_ERROR' | 'SIGN_IN_FAILED' | 'SESSION_EXPIRED' | 'REFRESH_FAILED' | 'SIGN_OUT_FAILED';
      message: string;
    };

/**
 * Magic Link送信結果の型定義
 */
export type MagicLinkResult =
  | {
      success: true;
      message: string;
      code: 'MAGIC_LINK_SENT';
    }
  | {
      success: false;
      message: string;
      code: 'VALIDATION_ERROR' | 'SEND_FAILED';
    };

/**
 * セッションチェック結果の型定義
 */
export type SessionCheckResult =
  | {
      success: true;
      user: {
        id: string;
        display_name?: string;
      };
    }
  | {
      success: false;
      error: 'SESSION_EXPIRED' | 'NO_SESSION';
      message: string;
    };

/**
 * Magic Link認証 - メールでログインリンクを送信
 *
 * Supabase signInWithOtpを使用してMagic Linkを送信する
 *
 * @param email - ユーザーのメールアドレス
 * @param redirectUrl - 認証後のリダイレクト先URL
 * @returns Magic Link送信結果（成功時はメッセージ、失敗時はエラー）
 *
 * 【処理フロー】
 * 1. メールアドレスのバリデーション
 * 2. Supabase signInWithOtp実行（Magic Link送信）
 * 3. 成功時は確認メッセージを返す
 *
 * 【エラーケース】
 * - メールアドレスが不正 → VALIDATION_ERROR
 * - Supabaseエラー → SEND_FAILED
 *
 * @see Issue #51 - Magic Link認証への移行
 */
export async function signInWithMagicLink(
  email: string,
  redirectUrl: string
): Promise<MagicLinkResult> {
  // Step 1: メールアドレスのバリデーション（簡易チェック）
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return {
      success: false,
      message: '有効なメールアドレスを入力してください。',
      code: 'VALIDATION_ERROR',
    };
  }

  const supabase = createClient();

  // Step 2: Supabase signInWithOtp実行（Magic Link送信）
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // メール認証後のリダイレクト先
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error('Magic Link送信エラー:', error);
    return {
      success: false,
      message: 'メールの送信に失敗しました。再度お試しください。',
      code: 'SEND_FAILED',
    };
  }

  // Step 3: 成功時は確認メッセージを返す
  return {
    success: true,
    message: 'ログインリンクをメールで送信しました。メールを確認してください。',
    code: 'MAGIC_LINK_SENT',
  };
}

/**
 * T150: セッションチェック
 *
 * 現在のセッションが有効かどうかをチェックし、
 * ユーザー情報を返す
 *
 * @returns セッションチェック結果（成功時はユーザー情報、失敗時はエラー）
 *
 * 【処理フロー】
 * 1. Supabase getUser()でセッションチェック
 * 2. usersテーブルからプロフィール情報取得（display_name）
 * 3. 成功時はユーザー情報を返す
 *
 * 【エラーケース】
 * - セッションが存在しない → NO_SESSION
 * - セッションが有効期限切れ → SESSION_EXPIRED
 */
export async function checkSession(): Promise<SessionCheckResult> {
  const supabase = createClient();

  // Step 1: セッションチェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: authError ? 'SESSION_EXPIRED' : 'NO_SESSION',
      message: 'ログインが必要です。',
    };
  }

  // Step 2: usersテーブルからプロフィール情報取得
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // プロフィール情報がない場合はユーザーIDのみ返す
    return {
      success: true,
      user: {
        id: user.id,
      },
    };
  }

  // Step 3: 成功時はユーザー情報を返す
  return {
    success: true,
    user: {
      id: user.id,
      display_name: profile.display_name,
    },
  };
}

/**
 * T150: セッションリフレッシュ
 *
 * セッショントークンをリフレッシュして有効期限を延長
 *
 * @returns 認証結果（成功時はユーザー情報、失敗時はエラー）
 *
 * 【処理フロー】
 * 1. Supabase refreshSession()実行
 * 2. 成功時はユーザー情報を返す
 *
 * 【エラーケース】
 * - リフレッシュ失敗 → REFRESH_FAILED
 */
export async function refreshSession(): Promise<AuthResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.user) {
    return {
      success: false,
      error: 'REFRESH_FAILED',
      message: 'セッションのリフレッシュに失敗しました。再度ログインしてください。',
    };
  }

  // usersテーブルからdisplay_name取得
  const { data: profile } = await supabase.from('users').select('display_name').eq('id', data.user.id).single();

  return {
    success: true,
    user: {
      id: data.user.id,
      display_name: profile?.display_name || '',
    },
  };
}

/**
 * T151: ログアウト
 *
 * 現在のセッションを削除してログアウト
 *
 * @returns 認証結果（成功時はsuccess: true、失敗時はエラー）
 *
 * 【処理フロー】
 * 1. Supabase signOut()実行
 * 2. セッションが削除される
 *
 * 【エラーケース】
 * - ログアウト失敗 → SIGN_OUT_FAILED
 *
 * 【注意】
 * 匿名認証のため、ログアウト後の再ログイン時は新しいユーザーIDが発行される
 * 以前のイベント投稿・つながりリストは引き継がれない
 */
export async function signOut(): Promise<
  | { success: true }
  | { success: false; error: string; message: string }
> {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: 'SIGN_OUT_FAILED',
      message: 'ログアウトに失敗しました。再度お試しください。',
    };
  }

  return {
    success: true,
  };
}
