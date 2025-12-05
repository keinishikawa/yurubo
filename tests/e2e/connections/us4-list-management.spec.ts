/**
 * ファイル名: us4-list-management.spec.ts
 *
 * 【概要】
 * User Story 4（つながりリストの閲覧・管理）のE2Eテスト
 * spec.mdの受入シナリオをテストケース化
 *
 * 【テスト対象】
 * - つながりリスト一覧表示
 * - カテゴリフィルタ機能
 * - 名前検索機能
 * - つながり削除機能
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 * - spec.md: User Story 4の受入シナリオ定義
 * - seed.ts: テストデータ作成ヘルパー
 */

import { test, expect } from "@playwright/test";
import { signInWithMagicLink } from "../helpers/auth";
import { createTestUser, seedConnection, cleanupTestData, TestUser } from "../helpers/seed";

/**
 * テストスイート: User Story 4 - つながりリストの閲覧・管理
 *
 * 【設計根拠】spec.md User Story 4の受入シナリオ
 */
test.describe("User Story 4: つながりリストの閲覧・管理", () => {
  // テスト用ユーザー（スイート全体で共有）
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser;

  /**
   * テストスイート開始前にテストデータを作成
   */
  test.beforeAll(async () => {
    // テストユーザーを作成
    userA = await createTestUser("テストユーザーA");
    userB = await createTestUser("飲み友達B");
    userC = await createTestUser("旅行仲間C");

    // つながりを作成
    // A-B: 飲みカテゴリのみOK
    await seedConnection(userA.id, userB.id, { drinking: true });
    // A-C: 旅行カテゴリのみOK
    await seedConnection(userA.id, userC.id, { travel: true });
  });

  /**
   * テストスイート終了後にテストデータをクリーンアップ
   */
  test.afterAll(async () => {
    await cleanupTestData();
  });

  /**
   * ブラウザコンソールログとエラーをキャプチャ（デバッグ用）
   */
  test.beforeEach(async ({ page }) => {
    // ブラウザコンソールログをキャプチャ
    page.on("console", (msg) => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // ページエラーをキャプチャ
    page.on("pageerror", (err) => {
      console.error(`[PAGE ERROR] ${err.message}`);
    });

    // ネットワークレスポンスエラーをキャプチャ
    page.on("response", (response) => {
      if (!response.ok() && response.url().includes("/api/")) {
        console.error(`[API ERROR] ${response.status()} ${response.url()}`);
      }
    });
  });

  /**
   * T032-1: つながりリスト一覧ページが表示される
   *
   * Given: ログイン済みユーザー
   * When: /connections ページにアクセス
   * Then: つながりリストページが表示される
   */
  test("T032-1: つながりリストページが表示される", async ({ page }) => {
    // Given: userAでログイン
    await signInWithMagicLink(page, userA.email);

    // When: つながりリストページにアクセス
    await page.goto("/connections");

    // Then: ページが表示される
    await expect(page.locator('h1:has-text("つながりリスト")')).toBeVisible({ timeout: 10000 });
  });

  /**
   * T032-2: つながりがない場合、空状態メッセージが表示される
   *
   * Given: ログイン済みユーザーでつながりが0件
   * When: /connections ページにアクセス
   * Then: 「つながりがありません」メッセージが表示される
   */
  test("T032-2: つながりがない場合、空状態メッセージが表示される", async ({ page }) => {
    // Given: 新規ユーザーを作成（つながり0件）
    const newUser = await createTestUser("新規ユーザーUS4-2");

    // 新規ユーザーでログイン
    await signInWithMagicLink(page, newUser.email);

    // When: つながりリストページにアクセス
    await page.goto("/connections");

    // Then: 空状態メッセージが表示される
    await expect(page.locator("text=つながりがありません")).toBeVisible({ timeout: 10000 });
  });

  /**
   * T032-3: カテゴリフィルタ - 全カテゴリ表示
   *
   * Given: つながりリストページが表示されている
   * When: カテゴリフィルタが「すべて」の場合
   * Then: すべてのつながりが表示される
   */
  test("T032-3: カテゴリフィルタ「すべて」で全つながりが表示される", async ({ page }) => {
    // Given: userAでログイン
    await signInWithMagicLink(page, userA.email);
    await page.goto("/connections");

    // When: 「すべて」フィルタが選択された状態（デフォルト）
    // Then: B, C両方のつながりが表示される
    await expect(page.locator(`text=${userB.displayName}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${userC.displayName}`)).toBeVisible({ timeout: 10000 });
  });

  /**
   * T032-4: カテゴリフィルタ - 特定カテゴリのみ表示
   *
   * Given: つながりリストページが表示されている
   * When: カテゴリフィルタで「飲み」を選択
   * Then: 飲みカテゴリがOKのつながりのみ表示される
   */
  test("T032-4: カテゴリフィルタで「飲み」を選択すると、飲みOKのつながりのみ表示される", async ({
    page,
  }) => {
    // Given: userAでログイン
    await signInWithMagicLink(page, userA.email);
    await page.goto("/connections");

    // When: 「飲み」フィルタを選択
    await page.locator('[data-testid="category-filter"]').click();
    await page.locator('[data-testid="category-option-drinking"]').click();

    // Then: 飲みOKのBのみが表示される
    await expect(page.locator(`text=${userB.displayName}`)).toBeVisible({ timeout: 10000 });
    // Cは表示されない
    await expect(page.locator(`text=${userC.displayName}`)).not.toBeVisible();
  });

  /**
   * T032-5: 名前検索機能
   *
   * Given: つながりリストページが表示されている
   * When: 検索ボックスに名前を入力
   * Then: 該当する名前のつながりのみ表示される
   */
  test("T032-5: 検索ボックスに名前を入力すると、該当するつながりのみ表示される", async ({
    page,
  }) => {
    // Given: userAでログイン
    await signInWithMagicLink(page, userA.email);
    await page.goto("/connections");

    // When: 「飲み友達」で検索
    await page.locator('[data-testid="search-input"]').fill("飲み友達");

    // Then: Bのみが表示される
    await expect(page.locator(`text=${userB.displayName}`)).toBeVisible({ timeout: 10000 });
    // Cは表示されない
    await expect(page.locator(`text=${userC.displayName}`)).not.toBeVisible();
  });

  /**
   * T032-6: つながり削除 - 確認ダイアログが表示される
   *
   * Given: つながりが存在する状態
   * When: 削除ボタンをクリック
   * Then: 削除確認ダイアログが表示される
   */
  test("T032-6: 削除ボタンクリックで確認ダイアログが表示される", async ({ page }) => {
    // Given: userAでログイン
    await signInWithMagicLink(page, userA.email);
    await page.goto("/connections");

    // つながりリストが表示されるまで待機
    await expect(page.locator(`text=${userB.displayName}`)).toBeVisible({ timeout: 10000 });

    // When: Bのつながりの削除ボタンをクリック
    const connectionCard = page.locator(
      `[data-testid="connection-card"]:has-text("${userB.displayName}")`
    );
    await connectionCard.locator('[data-testid="delete-button"]').click();

    // Then: 確認ダイアログが表示される
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=つながりを削除しますか")).toBeVisible();
  });

  /**
   * T032-7: つながり削除 - 確認後に削除される
   *
   * Given: 削除確認ダイアログが表示されている
   * When: 「削除」ボタンをクリック
   * Then: つながりが削除され、リストから消える
   */
  test("T032-7: 確認ダイアログで削除を選択すると、つながりが削除される", async ({ page }) => {
    // このテスト用に新しいつながりを作成
    const deleteTestUserA = await createTestUser("削除テストユーザーA");
    const deleteTestUserB = await createTestUser("削除テストユーザーB");
    await seedConnection(deleteTestUserA.id, deleteTestUserB.id, { drinking: true });

    // Given: deleteTestUserAでログイン
    await signInWithMagicLink(page, deleteTestUserA.email);
    await page.goto("/connections");

    // つながりリストが表示されるまで待機
    await expect(page.locator(`text=${deleteTestUserB.displayName}`)).toBeVisible({
      timeout: 10000,
    });

    // 削除ボタンをクリック
    const connectionCard = page.locator(
      `[data-testid="connection-card"]:has-text("${deleteTestUserB.displayName}")`
    );
    await connectionCard.locator('[data-testid="delete-button"]').click();

    // When: 確認ダイアログで「削除」をクリック
    await page.locator('[data-testid="confirm-delete-button"]').click();

    // Then: つながりがリストから消える
    await expect(page.locator(`text=${deleteTestUserB.displayName}`)).not.toBeVisible({
      timeout: 10000,
    });

    // 空状態メッセージが表示される（削除後は0件になるため）
    await expect(page.locator("text=つながりがありません")).toBeVisible();
  });

  /**
   * T032-8: つながり削除 - キャンセルで削除されない
   *
   * Given: 削除確認ダイアログが表示されている
   * When: 「キャンセル」ボタンをクリック
   * Then: ダイアログが閉じ、つながりは削除されない
   */
  test("T032-8: 確認ダイアログでキャンセルを選択すると、つながりは削除されない", async ({
    page,
  }) => {
    // このテスト用に新しいつながりを作成
    const cancelTestUserA = await createTestUser("キャンセルテストユーザーA");
    const cancelTestUserB = await createTestUser("キャンセルテストユーザーB");
    await seedConnection(cancelTestUserA.id, cancelTestUserB.id, { drinking: true });

    // Given: cancelTestUserAでログイン
    await signInWithMagicLink(page, cancelTestUserA.email);
    await page.goto("/connections");

    // つながりリストが表示されるまで待機
    await expect(page.locator(`text=${cancelTestUserB.displayName}`)).toBeVisible({
      timeout: 10000,
    });

    // 削除ボタンをクリック
    const connectionCard = page.locator(
      `[data-testid="connection-card"]:has-text("${cancelTestUserB.displayName}")`
    );
    await connectionCard.locator('[data-testid="delete-button"]').click();

    // 確認ダイアログが表示される
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible({ timeout: 5000 });

    // When: 確認ダイアログで「キャンセル」をクリック
    await page.locator('[data-testid="cancel-button"]').click();

    // Then: ダイアログが閉じる
    await expect(page.locator('[data-testid="confirm-dialog"]')).not.toBeVisible();

    // Then: つながりは削除されず、リストに残っている
    await expect(page.locator(`text=${cancelTestUserB.displayName}`)).toBeVisible();
  });
});
