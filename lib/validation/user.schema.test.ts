// @ts-nocheck
/**
 * ファイル名: user.schema.test.ts
 *
 * 【概要】
 * ユーザープロフィールバリデーションスキーマの単体テスト
 * 表示名バリデーション（T147: T171-T172）をテスト
 *
 * 【テスト対象】
 * - 表示名が空の場合のバリデーションエラー
 * - 表示名が50文字を超える場合のバリデーションエラー
 * - 正常な表示名のバリデーション成功
 *
 * 【依存関係】
 * - Jest: テストフレームワーク
 * - Zod: バリデーションライブラリ
 */

import { describe, it, expect } from '@jest/globals';
import { createUserProfileSchema } from './user.schema';

describe('user.schema', () => {
  describe('T147: createUserProfileSchema - 表示名バリデーション', () => {
    it('should pass validation with valid display name (1-50 chars)', () => {
      const validData = {
        display_name: 'テストユーザー',
      };

      const result = createUserProfileSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_name).toBe('テストユーザー');
      }
    });

    it('should pass validation with display name at max length (50 chars)', () => {
      const validData = {
        display_name: 'あ'.repeat(50), // 50文字ちょうど
      };

      const result = createUserProfileSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_name).toHaveLength(50);
      }
    });

    it('should fail validation when display name is empty (T171)', () => {
      const invalidData = {
        display_name: '',
      };

      const result = createUserProfileSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('表示名を入力してください');
      }
    });

    it('should fail validation when display name exceeds 50 chars (T172)', () => {
      const invalidData = {
        display_name: 'あ'.repeat(51), // 51文字
      };

      const result = createUserProfileSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('表示名は50文字以内で入力してください');
      }
    });

    it('should use default values for optional fields', () => {
      const minimalData = {
        display_name: 'テストユーザー',
      };

      const result = createUserProfileSchema.safeParse(minimalData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled_categories).toEqual(['drinking', 'travel', 'tennis', 'other']);
        expect(result.data.notification_preferences).toEqual({
          event_invitation: true,
          event_update: true,
          event_cancellation: true,
          participant_confirmed: true,
        });
      }
    });

    it('should accept optional avatar_url and bio', () => {
      const validData = {
        display_name: 'テストユーザー',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'よろしくお願いします',
      };

      const result = createUserProfileSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatar_url).toBe('https://example.com/avatar.jpg');
        expect(result.data.bio).toBe('よろしくお願いします');
      }
    });

    it('should fail validation when avatar_url is not a valid URL', () => {
      const invalidData = {
        display_name: 'テストユーザー',
        avatar_url: 'invalid-url',
      };

      const result = createUserProfileSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('プロフィール画像のURLが正しくありません');
      }
    });

    it('should fail validation when bio exceeds 500 chars', () => {
      const invalidData = {
        display_name: 'テストユーザー',
        bio: 'あ'.repeat(501), // 501文字
      };

      const result = createUserProfileSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('自己紹介は500文字以内で入力してください');
      }
    });
  });
});
