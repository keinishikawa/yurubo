/**
 * ファイル名: signOut.ts
 *
 * 【概要】
 * ログアウトServer Action - User Story 4 (T154)
 *
 * 【処理フロー】
 * 1. auth.service.tsのログアウト機能を呼び出す
 * 2. Supabaseセッションを削除
 * 3. 登録画面にリダイレクト
 *
 * 【依存関係】
 * - lib/services/auth.service: 認証サービス
 * - Supabase Auth
 *
 * @see specs/001-event-creation/spec.md - User Story 4 FR-025
 */

'use server';

import { signOut as signOutService } from '@/lib/services/auth.service';
import { redirect } from 'next/navigation';

/**
 * ログアウトレスポンスの型定義
 */
export type SignOutResponse =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
      message: string;
    };

/**
 * T154: ログアウトServer Action
 *
 * 現在のセッションを削除してログアウトし、登録画面にリダイレクト
 *
 * @returns ログアウト結果（成功時は自動リダイレクト、失敗時はエラー）
 *
 * 【使用例】
 * // クライアントコンポーネントから呼び出し
 * const result = await signOut();
 * if (result.success) {
 *   // 成功時は自動的に登録画面にリダイレクト
 * } else {
 *   // エラーメッセージを表示
 *   console.error(result.message);
 * }
 *
 * 【処理フロー】
 * 1. auth.service.tsのsignOut()を呼び出し
 * 2. Supabaseセッションを削除
 * 3. 成功時は/welcome（登録画面）にリダイレクト
 * 4. 失敗時はエラーを返す
 *
 * 【注意】
 * 匿名認証のため、ログアウト後の再ログイン時は新しいユーザーIDが発行される
 * 以前のイベント投稿・つながりリストは引き継がれない
 */
export async function signOut(): Promise<SignOutResponse> {
  // auth.service.tsのログアウト機能を呼び出し
  const result = await signOutService();

  if (!result.success) {
    return {
      success: false,
      error: (result.error as string) || 'UNKNOWN_ERROR',
      message: (result.message as string) || 'ログアウトに失敗しました',
    };
  }

  // 成功時は登録画面にリダイレクト
  redirect('/welcome');
}
