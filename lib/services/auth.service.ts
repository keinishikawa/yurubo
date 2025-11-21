/**
 * ファイル名: auth.service.ts
 *
 * 【概要】
 * 認証サービス - Supabase Anonymous Sign-inを使用した簡易認証機能
 *
 * 【主要機能】
 * - T149: 匿名サインイン（表示名のみで登録・ログイン）
 * - T150: セッション管理（check/refresh）
 * - T151: ログアウト
 *
 * 【依存関係】
 * - @supabase/supabase-js: Supabase クライアント
 * - user.schema: 表示名バリデーション
 *
 * @see .specify/specs/001-event-creation/spec.md - User Story 4 仕様
 */

import { createClient } from '@/lib/supabase/server';
import { createUserProfileSchema } from '@/lib/validation/user.schema';

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
 * T149: 匿名サインイン
 *
 * Supabase Anonymous Sign-inを使用してユーザーを作成し、
 * 表示名をusersテーブルに保存する
 *
 * @param displayName - ユーザーの表示名（1-50文字）
 * @returns 認証結果（成功時はユーザー情報、失敗時はエラー）
 *
 * 【処理フロー】
 * 1. 表示名のバリデーション（createUserProfileSchema）
 * 2. Supabase Anonymous Sign-in実行
 * 3. usersテーブルにプロフィール作成（display_name保存）
 * 4. 成功時はユーザー情報を返す
 *
 * 【エラーケース】
 * - 表示名が空またはバリデーションエラー → VALIDATION_ERROR
 * - Supabase認証エラー → SIGN_IN_FAILED
 * - プロフィール作成エラー → SIGN_IN_FAILED
 */
export async function signInAnonymously(displayName: string): Promise<AuthResult> {
  // Step 1: 表示名のバリデーション
  const validationResult = createUserProfileSchema.safeParse({
    display_name: displayName,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: validationResult.error.issues[0].message,
    };
  }

  const supabase = createClient();

  // Step 2: Supabase Anonymous Sign-in
  const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();

  if (signInError || !authData.user) {
    return {
      success: false,
      error: 'SIGN_IN_FAILED',
      message: '匿名ログインに失敗しました。再度お試しください。',
    };
  }

  // Step 3: usersテーブルにプロフィール作成
  const { error: profileError } = await supabase.from('users').upsert(
    {
      id: authData.user.id,
      display_name: validationResult.data.display_name,
      enabled_categories: validationResult.data.enabled_categories,
      notification_preferences: validationResult.data.notification_preferences,
    },
    {
      onConflict: 'id',
    }
  );

  if (profileError) {
    // プロフィール作成失敗時は認証もロールバック
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Failed to rollback authentication:', signOutError);
    }
    return {
      success: false,
      error: 'SIGN_IN_FAILED',
      message: 'プロフィール作成に失敗しました。再度お試しください。',
    };
  }

  // Step 4: 成功時はユーザー情報を返す
  return {
    success: true,
    user: {
      id: authData.user.id,
      display_name: validationResult.data.display_name,
    },
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
