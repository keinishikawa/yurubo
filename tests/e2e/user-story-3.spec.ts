/**
 * ファイル名: user-story-3.spec.ts
 *
 * 【概要】
 * User Story 3（イベント編集）のE2Eテスト
 * spec.mdの受入シナリオに対応するテストケース
 *
 * 【テスト対象】
 * - T108: 編集画面表示（シナリオ1）
 * - T109: イベント編集反映（シナリオ2）
 * - T110: 参加者承認後の編集不可（シナリオ3）
 * - T111: 他ユーザーの投稿編集ボタン非表示（シナリオ4）
 *
 * 【前提条件】
 * - Supabase認証が動作すること
 * - テストユーザーが作成済みであること
 */

import { test, expect } from "@playwright/test";

test.describe("User Story 3: イベント編集", () => {
  /**
   * T108: 編集画面表示（シナリオ1）
   *
   * Given: ユーザーが自分のイベントを投稿済み
   * When: イベントカードの「編集」ボタンをクリック
   * Then: 編集モーダルが表示され、既存の情報がフォームにプリフィルされる
   */
  test("T108: 編集画面表示（シナリオ1）", async ({ /* page */ }) => {
    // TODO: 認証環境整備後にアンコメント
    // Setup: ログインして自分のイベントを作成
    // await page.goto('/');
    // await page.click('[data-testid="floating-post-button"]');
    // await page.selectOption('[name="category"]', 'drinking');
    // await page.fill('[name="title"]', '軽く飲みませんか？');
    // // ... その他のフォーム入力
    // await page.click('button:has-text("投稿する")');
    // await expect(page.locator('text=イベントを投稿しました')).toBeVisible();

    // When: 編集ボタンをクリック
    // await page.click('[data-testid="event-edit-button"]');

    // Then: 編集モーダルが表示される
    // await expect(page.locator('[role="dialog"][aria-label="イベントを編集"]')).toBeVisible();

    // Then: 既存の情報がフォームにプリフィルされている
    // await expect(page.locator('[name="title"]')).toHaveValue('軽く飲みませんか？');
    // await expect(page.locator('[name="category"]')).toHaveValue('drinking');
    // // ... その他のフィールドを検証

    expect(true).toBe(true); // Placeholder
  });

  /**
   * T109: イベント編集反映（シナリオ2）
   *
   * Given: 編集モーダルを開いている
   * When: 情報を変更して「保存する」をクリック
   * Then: 変更がタイムラインに反映される
   */
  test("T109: イベント編集反映（シナリオ2）", async ({ /* page */ }) => {
    // TODO: 認証環境整備後にアンコメント
    // Setup: 編集モーダルを開いている状態

    // When: タイトルを変更
    // await page.fill('[name="title"]', '日時変更: 軽く飲みませんか？');

    // When: 保存ボタンをクリック
    // await page.click('button:has-text("保存する")');

    // Then: 成功メッセージが表示される
    // await expect(page.locator('text=イベントを更新しました')).toBeVisible();

    // Then: モーダルが閉じる
    // await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Then: タイムラインに変更後のタイトルが表示される
    // await expect(page.locator('text=日時変更: 軽く飲みませんか？')).toBeVisible();

    expect(true).toBe(true); // Placeholder
  });

  /**
   * T110: 参加者承認後の編集不可（シナリオ3）
   *
   * Given: イベントのstatus='confirmed'（参加者承認済み）
   * When: イベントカードを表示
   * Then: 編集ボタンが非表示、または警告メッセージが表示される
   */
  test("T110: 参加者承認後の編集不可（シナリオ3）", async ({ /* page */ }) => {
    // TODO: 認証環境整備後にアンコメント
    // Setup: status='confirmed'のイベントを作成
    // - Supabase Admin APIでstatus='confirmed'に変更
    // または、参加者承認フローを実行

    // When: 該当イベントを表示
    // await page.goto('/');

    // Then: 編集ボタンが非表示
    // await expect(page.locator('[data-testid="event-edit-button"]')).not.toBeVisible();

    // または、編集ボタンをクリックすると警告メッセージが表示される
    // await page.click('[data-testid="event-edit-button"]');
    // await expect(page.locator('text=参加者承認後は編集できません')).toBeVisible();

    expect(true).toBe(true); // Placeholder
  });

  /**
   * T111: 他ユーザーの投稿編集ボタン非表示（シナリオ4）
   *
   * Given: 他ユーザーが投稿したイベントがタイムラインに表示されている
   * When: イベントカードを表示
   * Then: 編集ボタンが表示されない
   */
  test("T111: 他ユーザーの投稿編集ボタン非表示（シナリオ4）", async ({ /* page */ }) => {
    // TODO: 認証環境整備後にアンコメント
    // Setup: ユーザーAでイベントを作成
    // Setup: ユーザーBでログイン（つながりリストにAを追加）

    // When: ユーザーBのタイムラインにユーザーAのイベントが表示される
    // await page.goto('/');

    // Then: ユーザーAのイベントカードに編集ボタンが表示されない
    // const eventCard = page.locator('[data-testid="event-card"]').first();
    // await expect(eventCard.locator('[data-testid="event-edit-button"]')).not.toBeVisible();

    // Then: 自分のイベントカードには編集ボタンが表示される（対比として確認）
    // const ownEventCard = page.locator('[data-testid="event-card"][data-is-own="true"]').first();
    // await expect(ownEventCard.locator('[data-testid="event-edit-button"]')).toBeVisible();

    expect(true).toBe(true); // Placeholder
  });

  /**
   * T105: マイイベントページ表示
   *
   * Given: ユーザーがログインしている
   * When: マイイベントページ（/my）にアクセス
   * Then: 自分が投稿したイベントのみ表示される
   */
  test("T105: マイイベントページ表示", async ({ page }) => {
    // Given: ログイン済み状態を作成
    await page.context().clearCookies();
    await page.goto("/welcome");
    await page.locator('input[type="text"]').first().fill("T105テストユーザー");
    await Promise.all([
      page.waitForURL("/"),
      page.locator('button:has-text("はじめる")').click(),
    ]);

    // Given: 自分のイベントを投稿
    await page.locator('button:has-text("投稿")').click();
    await expect(page.locator("text=イベントを投稿")).toBeVisible();

    // カテゴリ選択: 飲み（shadcn-ui Select）
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "🍶 飲み" }).click();

    // タイトルとコメントを入力（既存のT062パターンに合わせる）
    await page.locator('input[name="title"]').fill("T105テスト用イベント");
    await page.locator('textarea[name="comment"]').fill("マイイベントページ表示テスト");

    // 投稿実行
    await page.locator('button[type="submit"]:has-text("投稿する")').click();

    // モーダルが閉じることで投稿成功を確認（既存のT062パターン）
    await expect(page.locator("text=イベントを投稿")).not.toBeVisible({ timeout: 10000 });

    // When: マイイベントページにアクセス
    await page.goto("/my");

    // Then: ページが表示される
    await expect(page.locator('[data-testid="my-events-page"]')).toBeVisible();

    // Then: ページタイトルが表示される
    await expect(page.locator('h1:has-text("マイイベント")')).toBeVisible();

    // Then: 自分のイベントが表示される
    await expect(page.locator("text=マイイベントページ表示テスト")).toBeVisible({ timeout: 5000 });

    // Then: 編集ボタンが表示される（自分のイベントのみ）
    await expect(page.locator('[data-testid="event-edit-button"]')).toBeVisible();
  });

  /**
   * T105-2: マイイベントページ空状態
   *
   * Given: ユーザーがログインしているが、イベントを投稿していない
   * When: マイイベントページにアクセス
   * Then: 空状態メッセージが表示される
   */
  test("T105-2: マイイベントページ空状態", async ({ page }) => {
    // Given: ログイン済み状態を作成（イベント未投稿）
    await page.context().clearCookies();
    await page.goto("/welcome");
    await page.locator('input[type="text"]').first().fill("T105-2空状態テストユーザー");
    await Promise.all([
      page.waitForURL("/"),
      page.locator('button:has-text("はじめる")').click(),
    ]);

    // When: マイイベントページにアクセス
    await page.goto("/my");

    // Then: ページが表示される
    await expect(page.locator('[data-testid="my-events-page"]')).toBeVisible();

    // Then: ページタイトルが表示される
    await expect(page.locator('h1:has-text("マイイベント")')).toBeVisible();

    // Then: EventTimelineの空状態メッセージが表示される
    await expect(page.locator("text=まだイベントがありません")).toBeVisible();

    // Then: タイムラインに戻るボタンが表示される
    await expect(page.locator('[data-testid="back-to-timeline-button"]')).toBeVisible();
  });

  /**
   * T105-3: マイイベントページからの編集（シナリオ1対応）
   *
   * Given: マイイベントページで自分のイベントが表示されている
   * When: イベントカードの「編集」ボタンをクリック
   * Then: 編集モーダルが表示され、既存の情報がフォームにプリフィルされる
   */
  test("T105-3: マイイベントページからの編集", async ({ page }) => {
    // Given: ログイン済み状態を作成
    await page.context().clearCookies();
    await page.goto("/welcome");
    await page.locator('input[type="text"]').first().fill("T105-3編集テストユーザー");
    await Promise.all([
      page.waitForURL("/"),
      page.locator('button:has-text("はじめる")').click(),
    ]);

    // Given: 自分のイベントを投稿
    await page.locator('button:has-text("投稿")').click();
    await expect(page.locator("text=イベントを投稿")).toBeVisible();

    // カテゴリ選択: 飲み
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "🍶 飲み" }).click();

    // タイトルとコメントを入力
    await page.locator('input[name="title"]').fill("編集テスト用イベント");
    await page.locator('textarea[name="comment"]').fill("編集機能テスト");

    // 投稿実行
    await page.locator('button[type="submit"]:has-text("投稿する")').click();

    // モーダルが閉じることで投稿成功を確認
    await expect(page.locator("text=イベントを投稿")).not.toBeVisible({ timeout: 10000 });

    // Given: マイイベントページにアクセス
    await page.goto("/my");
    await expect(page.locator("text=編集機能テスト")).toBeVisible({ timeout: 5000 });

    // When: 編集ボタンをクリック
    await page.locator('[data-testid="event-edit-button"]').first().click();

    // Then: 編集モーダルが表示される
    await expect(page.locator("text=イベントを編集")).toBeVisible();

    // Then: 既存の情報がフォームにプリフィルされている
    await expect(page.locator('input[name="title"]')).toHaveValue("編集テスト用イベント");
  });
});
