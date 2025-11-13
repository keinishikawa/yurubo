/**
 * ファイル名: example.spec.ts
 *
 * 【概要】
 * PlaywrightによるE2Eテストのサンプルファイル
 * アプリケーションが正常に起動し、基本的なナビゲーションが機能することを確認
 *
 * 【テスト内容】
 * - ホームページへのアクセス
 * - ページタイトルの確認
 */

import { test, expect } from "@playwright/test";

/**
 * ホームページの基本動作テスト
 *
 * 【Given】アプリケーションが起動している
 * 【When】ルートURL（/）にアクセス
 * 【Then】ページが正常に表示される
 */
test("ホームページが正常に表示される", async ({ page }) => {
  // Arrange & Act: ホームページにアクセス
  await page.goto("/");

  // Assert: ページタイトルに"Create Next App"が含まれることを確認
  // Phase 1では Next.jsのデフォルトタイトルを使用
  await expect(page).toHaveTitle(/Create Next App/i);
});
