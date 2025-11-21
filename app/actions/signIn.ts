/**
 * ファイル名: signIn.ts
 *
 * 【概要】
 * 匿名サインインServer Action - User Story 4 (T152)
 *
 * 【処理フロー】
 * 1. クライアントから表示名を受け取る
 * 2. auth.service.tsの匿名サインイン機能を呼び出す
 * 3. 結果をクライアントに返す
 *
 * 【依存関係】
 * - lib/services/auth.service: 認証サービス
 * - Supabase Anonymous Sign-in
 *
 * @see specs/001-event-creation/spec.md - User Story 4 FR-022, FR-023
 */

'use server';

import { signInAnonymously } from '@/lib/services/auth.service';

/**
 * サインインレスポンスの型定義
 */
export type SignInResponse =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
      message: string;
    };

/**
 * T152: 匿名サインインServer Action
 *
 * クライアントから表示名を受け取り、Supabase Anonymous Sign-inで
 * ユーザーを作成する
 *
 * @param displayName - ユーザーの表示名（1-50文字）
 * @returns サインイン結果（成功時は自動リダイレクト、失敗時はエラー）
 *
 * 【使用例】
 * // クライアントコンポーネントから呼び出し
 * const result = await signIn('テストユーザー');
 * if (result.success) {
 *   // 成功時は自動的にタイムライン画面にリダイレクト
 * } else {
 *   // エラーメッセージを表示
 *   console.error(result.message);
 * }
 *
 * 【処理フロー】
 * 1. 表示名バリデーション（auth.service内で実行）
 * 2. Supabase Anonymous Sign-in実行
 * 3. usersテーブルにプロフィール作成
 * 4. 成功時は/（タイムライン）にリダイレクト
 * 5. 失敗時はエラーを返す
 *
 * 【エラーケース】
 * - 表示名が空または50文字超過 → バリデーションエラー
 * - Supabase認証エラー → サインイン失敗
 */
export async function signIn(displayName: string): Promise<SignInResponse> {
  // auth.service.tsの匿名サインイン機能を呼び出し
  const result = await signInAnonymously(displayName);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      message: result.message,
    };
  }

  // 成功時は成功レスポンスを返す（クライアント側でリダイレクト）
  return {
    success: true,
  };
}
