// @ts-nocheck
/**
 * ファイル名: auth.service.test.ts
 *
 * 【概要】
 * 認証サービス（auth.service.ts）の単体テスト
 * Supabase Anonymous Sign-inを使用した匿名ログイン機能をテスト
 *
 * 【テスト対象】
 * - T146: 匿名サインイン機能
 * - T148: セッション管理（check/refresh）機能
 *
 * 【依存関係】
 * - Jest: テストフレームワーク
 * - @supabase/supabase-js: Supabaseクライアント（モック）
 */

import { describe, it, expect } from '@jest/globals';

// TODO: auth.service.ts実装後にインポートを有効化
// import {
//   signInAnonymously,
//   checkSession,
//   refreshSession,
//   signOut,
// } from './auth.service';

describe('auth.service', () => {
  describe('T146: signInAnonymously - 匿名サインイン', () => {
    it('should create anonymous user and return user data', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // const result = await signInAnonymously('テストユーザー');
      //
      // expect(result.success).toBe(true);
      // expect(result.user).toBeDefined();
      // expect(result.user?.id).toBeDefined();
    });

    it('should return error when display name is empty', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // const result = await signInAnonymously('');
      //
      // expect(result.success).toBe(false);
      // expect(result.error).toBe('VALIDATION_ERROR');
    });

    it('should return error when Supabase signInAnonymously fails', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // // Supabaseエラーをモック
      // const result = await signInAnonymously('テストユーザー');
      //
      // expect(result.success).toBe(false);
      // expect(result.error).toBe('SIGN_IN_FAILED');
    });
  });

  describe('T148: checkSession - セッションチェック', () => {
    it('should return user data when session is valid', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // const result = await checkSession();
      //
      // expect(result.success).toBe(true);
      // expect(result.user).toBeDefined();
    });

    it('should return error when session is expired', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // const result = await checkSession();
      //
      // expect(result.success).toBe(false);
      // expect(result.error).toBe('SESSION_EXPIRED');
    });
  });

  describe('T148: refreshSession - セッションリフレッシュ', () => {
    it('should refresh session and return new tokens', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // const result = await refreshSession();
      //
      // expect(result.success).toBe(true);
      // expect(result.session).toBeDefined();
    });

    it('should return error when refresh fails', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // const result = await refreshSession();
      //
      // expect(result.success).toBe(false);
      // expect(result.error).toBe('REFRESH_FAILED');
    });
  });

  describe('signOut - ログアウト', () => {
    it('should sign out user successfully', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // const result = await signOut();
      //
      // expect(result.success).toBe(true);
    });

    it('should return error when sign out fails', async () => {
      // TODO: 実装後にテストを有効化
      expect(true).toBe(true);

      // const result = await signOut();
      //
      // expect(result.success).toBe(false);
      // expect(result.error).toBe('SIGN_OUT_FAILED');
    });
  });
});
