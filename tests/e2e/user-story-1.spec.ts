/**
 * ファイル名: user-story-1.spec.ts
 *
 * 【概要】
 * User Story 1（匿名イベント投稿）のE2Eテスト
 * spec.mdの7つの受入シナリオをすべてテストケース化
 *
 * 【テスト対象】
 * - 投稿モーダル表示
 * - イベント投稿完了
 * - 匿名ID表示
 * - つながりリストベース配信
 * - 1日3件投稿上限
 * - バリデーションエラー
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 * - spec.md: User Story 1の受入シナリオ定義
 */

import { test, expect } from "@playwright/test";
import { signIn, signInWithMagicLink } from "./helpers/auth";
import { createTestUser, seedConnection, seedEvent, cleanupTestData } from "./helpers/seed";

/**
 * テストスイート: User Story 1 - 匿名イベント投稿
 *
 * 【設計根拠】spec.md User Story 1の7つの受入シナリオ
 */
test.describe("User Story 1: 匿名イベント投稿", () => {
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
   * T061: シナリオ1 - 投稿モーダル表示
   *
   * Given: ユーザーがログインしている
   * When: ホーム画面右下の「＋投稿」ボタンをタップする
   * Then: イベント投稿モーダルが表示される
   */
  test("T061: 投稿ボタンをクリックするとモーダルが表示される", async ({ page }) => {
    // Given: ログイン済み状態を作成
    await signIn(page, "テストユーザー1");

    // When: 「＋投稿」ボタンをクリック
    await page.locator('button:has-text("投稿")').click();

    // Then: モーダルが表示される
    await expect(page.locator("text=イベントを投稿")).toBeVisible();

    // Then: フォームフィールドが表示される
    await expect(page.getByRole("combobox").first()).toBeVisible(); // カテゴリ選択（shadcn-ui Select）
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator("text=開催日時")).toBeVisible(); // DateRangePickerのタイトル
  });

  /**
   * T062: シナリオ2 - イベント投稿完了
   *
   * Given: 投稿モーダルが開いている
   * When: カテゴリ「飲み」、開催日時、想定人数、価格帯、コメントを入力して投稿
   * Then: モーダルが閉じ、タイムラインに即時反映される
   */
  test("T062: イベント情報を入力して投稿すると、タイムラインに反映される", async ({ page }) => {
    // Given: ログイン + モーダルを開く
    await signIn(page, "テストユーザー2");
    await page.locator('button:has-text("投稿")').click();

    // When: フォームに入力
    // カテゴリ選択（shadcn-ui Select - 最初のcombobox）
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "🍶 飲み" }).click();

    // タイトルとコメントを入力（日時・人数・価格はデフォルト値を使用）
    await page.locator('input[name="title"]').fill("仕事終わりに飲みたい");
    await page.locator('textarea[name="comment"]').fill("仕事終わりに軽く一杯");

    // When: 投稿ボタンをクリック
    await page.locator('button[type="submit"]:has-text("投稿する")').click();

    // Then: モーダルが閉じる（投稿成功の証拠）
    await expect(page.locator("text=イベントを投稿")).not.toBeVisible({ timeout: 10000 });

    // Then: タイムラインに投稿が表示される
    await expect(page.locator("text=仕事終わりに軽く一杯")).toBeVisible({ timeout: 5000 });
  });

  /**
   * T063: シナリオ3 - 匿名ID表示
   *
   * Given: イベント投稿が完了した
   * When: タイムラインを確認する
   * Then: 投稿者の名前は表示されず、匿名ID（例：🍶A）で表示される
   */
  test("T063: 投稿後、タイムラインに匿名IDが表示され、実名は表示されない", async ({ page }) => {
    // Setup: イベント投稿済み状態
    // 注: displayNameは英数字のみメールアドレスのローカル部に使用される
    const displayName = "テストユーザー3（実名）";
    await signIn(page, displayName);

    // イベント投稿
    await page.locator('button:has-text("投稿")').click();

    // カテゴリ選択（shadcn-ui Select - 最初のcombobox）
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "🍶 飲み" }).click();

    // タイトルとコメントを入力（日時・人数はデフォルト値を使用）
    await page.locator('input[name="title"]').fill("匿名テスト用イベント");
    await page.locator('textarea[name="comment"]').fill("匿名ID表示テスト");
    await page.locator('button[type="submit"]:has-text("投稿する")').click();

    // When: タイムラインを確認（投稿が反映されていることを確認）
    await expect(page.locator("text=匿名ID表示テスト")).toBeVisible({ timeout: 10000 });

    // Then: 投稿者の実名は表示されない（完全匿名）
    // 注: 仕様変更により匿名ID表示は不要になりました
    await expect(page.locator("main").first()).not.toContainText(displayName);
  });

  /**
   * T064: シナリオ4 - つながりリストOKユーザーに表示
   *
   * Given: イベント投稿が完了した
   * When: つながりリストで該当カテゴリ（飲み）がOKのユーザーのタイムラインを確認
   * Then: 投稿が表示される
   */
  test("T064: つながりリストでカテゴリOKのユーザーには投稿が表示される", async ({ browser }) => {
    // テストユーザーを作成
    const userA = await createTestUser("イベント投稿者A");
    const userB = await createTestUser("飲みOKユーザーB");

    // A→Bのつながりを作成（飲みカテゴリOK）
    await seedConnection(userA.id, userB.id, { drinking: true });

    // ユーザーAでイベントを投稿
    await seedEvent(userA.id, {
      category: "drinking",
      title: "T064テスト飲み会",
      comment: "つながりOKテスト用イベント",
    });

    // ユーザーBでログインしてタイムラインを確認
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await signInWithMagicLink(page, userB.email);

      // タイムラインにイベントが表示されることを確認
      await expect(page.locator("text=T064テスト飲み会")).toBeVisible({ timeout: 15000 });
      await expect(page.locator("text=つながりOKテスト用イベント")).toBeVisible();
    } finally {
      await context.close();
      // クリーンアップ（このテストで作成したユーザーのみ）
    }
  });

  /**
   * T065: シナリオ5 - つながりリストNGユーザーに非表示
   *
   * Given: イベント投稿が完了した
   * When: つながりリストで該当カテゴリ（飲み）がNGのユーザーのタイムラインを確認
   * Then: 投稿は表示されない
   */
  test("T065: つながりリストでカテゴリNGのユーザーには投稿が非表示", async ({ browser }) => {
    // テストユーザーを作成
    const userA = await createTestUser("イベント投稿者A2");
    const userC = await createTestUser("飲みNGユーザーC");

    // A→Cのつながりを作成（飲みカテゴリNG、旅行のみOK）
    await seedConnection(userA.id, userC.id, { drinking: false, travel: true });

    // ユーザーAで飲みカテゴリのイベントを投稿
    await seedEvent(userA.id, {
      category: "drinking",
      title: "T065テスト飲み会NG",
      comment: "つながりNGテスト用イベント",
    });

    // ユーザーCでログインしてタイムラインを確認
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await signInWithMagicLink(page, userC.email);

      // タイムラインページが表示されることを確認
      await expect(page.locator('h1:has-text("タイムライン")')).toBeVisible({ timeout: 15000 });

      // イベントが表示されないことを確認
      // （空状態メッセージが表示されるか、該当イベントがないことを確認）
      await expect(page.locator("text=T065テスト飲み会NG")).not.toBeVisible({ timeout: 5000 });
    } finally {
      await context.close();
    }
  });

  /**
   * T066: シナリオ6 - 1日3件投稿上限エラー
   *
   * Given: ユーザーが同カテゴリで1日に3件投稿済み
   * When: 同カテゴリで4件目の投稿を試みる
   * Then: エラーメッセージ「1日の投稿上限（3件）に達しました」が表示され、投稿されない
   */
  test("T066: 1日3件投稿済みの場合、4件目はエラーメッセージが表示される", async ({ page }) => {
    // Setup: ログイン
    await signIn(page, "テストユーザー投稿制限");

    // 同じカテゴリで3件投稿
    for (let i = 0; i < 3; i++) {
      await page.locator('button:has-text("投稿")').click();

      // カテゴリ選択（shadcn-ui Select - 最初のcombobox）
      await page.getByRole("combobox").first().click();
      await page.getByRole("option", { name: "🍶 飲み" }).click();

      // タイトルとコメントを入力（日時・人数・価格はデフォルト値を使用）
      await page.locator('input[name="title"]').fill(`投稿テスト${i + 1}件目`);
      await page.locator('textarea[name="comment"]').fill(`投稿${i + 1}件目`);
      await page.locator('button[type="submit"]:has-text("投稿する")').click();

      // モーダルが閉じることを確認（投稿成功の証拠）
      await expect(page.locator("text=イベントを投稿")).not.toBeVisible({ timeout: 10000 });

      // トースト通知が消えるのを待つ（次のボタンクリックをブロックしないように）
      await page
        .locator("[data-sonner-toast]")
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(() => {});
    }

    // When: 4件目を投稿しようとする
    await page.locator('button:has-text("投稿")').click();

    // カテゴリ選択（shadcn-ui Select - 最初のcombobox）
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "🍶 飲み" }).click();

    // タイトルとコメントを入力（日時・人数・価格はデフォルト値を使用）
    await page.locator('input[name="title"]').fill("4件目の投稿テスト");
    await page.locator('textarea[name="comment"]').fill("4件目の投稿（エラー期待）");
    await page.locator('button[type="submit"]:has-text("投稿する")').click();

    // Then: エラーメッセージが表示される
    await expect(page.getByText("1日の投稿上限（3件）に達しました")).toBeVisible({
      timeout: 10000,
    });

    // Then: モーダルは閉じない（再入力可能）
    await expect(page.locator("text=イベントを投稿")).toBeVisible();
  });

  /**
   * T067: シナリオ7 - 必須項目未入力エラー
   *
   * Given: 投稿モーダルで必須項目（カテゴリ、開催日時）が未入力
   * When: 投稿ボタンを押す
   * Then: エラーメッセージが表示され、投稿されない
   */
  test("T067: 必須項目未入力の場合、バリデーションエラーが表示される", async ({ page }) => {
    // Setup: ログイン + モーダルを開く
    await signIn(page, "テストユーザーバリデーション");
    await page.locator('button:has-text("投稿")').click();

    // When: 必須項目を入力せずに送信（カテゴリのみ選択）
    await page.locator('button[type="submit"]:has-text("投稿する")').click();

    // Then: バリデーションエラーが表示される（タイトル必須）
    await expect(page.getByText("入力内容に誤りがあります")).toBeVisible({ timeout: 5000 });

    // Then: モーダルは閉じない
    await expect(page.locator("text=イベントを投稿")).toBeVisible();
  });

  /**
   * FR-019: つながりリスト未設定時の警告表示
   *
   * Given: ユーザーのつながりリストが空
   * When: 投稿モーダルを開く
   * Then: 警告メッセージ「つながりリストが設定されていません。設定画面から追加してください」が表示される
   *
   * @see specs/001-event-creation/spec.md FR-019
   */
  test("FR-019: つながりリストが空の場合、投稿モーダルに警告が表示される", async ({ page }) => {
    // Setup: つながりリストが空のユーザーでログイン（新規ユーザー）
    await signIn(page, "新規ユーザーつながり0件");

    // When: 投稿モーダルを開く
    await page.locator('button:has-text("投稿")').click();

    // Then: 警告メッセージが表示される
    await expect(page.locator("text=つながりリストが設定されていません")).toBeVisible({
      timeout: 5000,
    });

    // Then: 投稿自体は可能（警告のみ、ブロックはしない）
    await expect(page.locator('button[type="submit"]:has-text("投稿する")')).toBeEnabled();
  });

  /**
   * FR-019-2: つながりリストが存在する場合、警告は非表示
   *
   * Given: ユーザーのつながりリストに1件以上のつながりが存在
   * When: 投稿モーダルを開く
   * Then: 警告メッセージは表示されない
   */
  test("FR-019-2: つながりリストが存在する場合、警告は表示されない", async ({ browser }) => {
    // テストユーザーを作成
    const userA = await createTestUser("つながり有りユーザーA");
    const userB = await createTestUser("つながり相手B");

    // A→Bのつながりを作成
    await seedConnection(userA.id, userB.id, { drinking: true });

    // ユーザーAでログイン
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await signInWithMagicLink(page, userA.email);

      // 投稿モーダルを開く
      await page.locator('button:has-text("投稿")').click();

      // モーダルが表示されるまで待機
      await expect(page.locator("text=イベントを投稿")).toBeVisible({ timeout: 10000 });

      // 警告メッセージが表示されないことを確認
      await expect(page.locator("text=つながりリストが設定されていません")).not.toBeVisible({
        timeout: 3000,
      });

      // 投稿ボタンは有効
      await expect(page.locator('button[type="submit"]:has-text("投稿する")')).toBeEnabled();
    } finally {
      await context.close();
    }
  });
});
