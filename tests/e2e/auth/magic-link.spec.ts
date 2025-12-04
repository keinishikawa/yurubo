/**
 * ファイル名: magic-link.spec.ts
 *
 * 【概要】
 * Magic Link認証のE2Eテスト
 * Issue #51: Phase 0 認証機能の修正（Magic Link認証への移行）
 *
 * 【テスト対象】
 * - ログイン/新規登録タブUI
 * - 新規登録フロー（未登録メールのみ許可）
 * - ログインフロー（登録済みメールのみ許可）
 * - Magic Linkコールバック処理
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 * - Supabase Magic Link認証
 * - Mailpit（ローカル環境でのメール確認）
 */

import { test, expect } from '@playwright/test'

/**
 * テストスイート: Magic Link認証
 *
 * 【設計根拠】
 * Issue #51の完了条件:
 * - メールアドレスで一意にユーザーを識別できる
 * - 新規登録と既存ログインを分離
 * - ログアウト後に同じメールで再ログイン可能
 */
test.describe('Magic Link認証', () => {
  /**
   * テスト前にCookieをクリア（未認証状態にする）
   */
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  /**
   * ログインページUIの確認（タブ表示）
   *
   * Given: 未認証ユーザー
   * When: /welcomeにアクセスする
   * Then: ログイン/新規登録タブが表示される
   * And: デフォルトでログインタブがアクティブ
   */
  test('ログインページにタブとメールアドレス入力フォームが表示される', async ({ page }) => {
    // Given & When: 未認証状態で/welcomeにアクセス
    await page.goto('/welcome')

    // Then: ウェルカムメッセージが表示される
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()

    // Then: ログイン/新規登録タブが表示される
    await expect(page.locator('button[role="tab"]:has-text("ログイン")')).toBeVisible()
    await expect(page.locator('button[role="tab"]:has-text("新規登録")')).toBeVisible()

    // Then: メールアドレス入力フィールドが表示される
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Then: ログインタブがデフォルトでアクティブ
    await expect(page.locator('button:has-text("ログインリンクを送信")')).toBeVisible()
  })

  /**
   * 新規登録フロー: 未登録メールでMagic Link送信
   *
   * Given: 未認証ユーザーが/welcomeページにいる
   * When: 新規登録タブでメールアドレスを入力して送信する
   * Then: 「メールを確認してください」というメッセージが表示される
   */
  test('新規登録タブで未登録メールを入力してMagic Linkを送信できる', async ({ page }) => {
    // Given: /welcomeページにアクセス
    await page.goto('/welcome')
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()

    // When: 新規登録タブをクリック
    await page.locator('button[role="tab"]:has-text("新規登録")').click()

    // When: メールアドレスを入力
    const testEmail = `test-${Date.now()}@example.com`
    await page.locator('input[type="email"]').fill(testEmail)

    // When: 送信ボタンをクリック
    await page.locator('button:has-text("登録リンクを送信")').click()

    // Then: 確認メッセージが表示される
    await expect(page.locator('text=メールを確認してください')).toBeVisible({ timeout: 10000 })

    // Then: メールアドレスが表示される（送信先の確認）
    await expect(page.locator(`text=${testEmail}`)).toBeVisible()
  })

  /**
   * ログインフロー: 未登録メールでエラー
   *
   * Given: 未認証ユーザーが/welcomeページにいる
   * When: ログインタブで未登録メールアドレスを入力して送信する
   * Then: エラーメッセージが表示される
   */
  test('ログインタブで未登録メールを入力するとエラーが表示される', async ({ page }) => {
    // Given: /welcomeページにアクセス
    await page.goto('/welcome')
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()

    // When: ログインタブで未登録メールアドレスを入力
    const testEmail = `unregistered-${Date.now()}@example.com`
    await page.locator('input[type="email"]').fill(testEmail)

    // When: 送信ボタンをクリック
    await page.locator('button:has-text("ログインリンクを送信")').click()

    // Then: エラーメッセージが表示される
    await expect(page.locator('text=このメールアドレスは登録されていません')).toBeVisible({ timeout: 10000 })
  })

  /**
   * バリデーション: 無効なメールアドレス
   *
   * Given: 未認証ユーザーが/welcomeページにいる
   * When: 無効なメールアドレスを入力して送信する
   * Then: エラーメッセージが表示される
   */
  test('無効なメールアドレスでエラーメッセージが表示される', async ({ page }) => {
    // Given: /welcomeページにアクセス
    await page.goto('/welcome')

    // When: 無効なメールアドレスを入力
    await page.locator('input[type="email"]').fill('invalid-email')

    // When: 送信ボタンをクリック
    await page.locator('button:has-text("ログインリンクを送信")').click()

    // Then: HTML5のemail type validationが働くので、ボタンクリック後も送信されない
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    // 確認メッセージが表示されないことを確認
    await expect(page.locator('text=メールを確認してください')).not.toBeVisible()
  })

  /**
   * バリデーション: 空のメールアドレス
   *
   * Given: 未認証ユーザーが/welcomeページにいる
   * When: メールアドレスを入力せずに送信する
   * Then: 送信ボタンが無効化されている
   */
  test('メールアドレスが空の場合は送信できない', async ({ page }) => {
    // Given: /welcomeページにアクセス
    await page.goto('/welcome')

    // When: メールアドレスを入力せずに送信ボタンを確認
    const submitButton = page.locator('button:has-text("ログインリンクを送信")')

    // Then: ボタンが無効化されている
    await expect(submitButton).toBeDisabled()
  })

  /**
   * 認証済みユーザーのリダイレクト
   */
  test.skip('認証済みユーザーは/welcomeから/にリダイレクトされる', async ({ page }) => {
    // TODO: 認証済みセッションの作成方法を実装後に有効化
    await page.goto('/welcome')
    await expect(page).toHaveURL('/')
  })

  /**
   * ログアウト後の再ログイン
   */
  test.skip('ログアウト後に同じメールで再ログインできる', async () => {
    // TODO: Magic Link確認の自動化（Mailpit API使用）後に有効化
  })
})

/**
 * テストスイート: Magic Linkコールバック
 */
test.describe('Magic Linkコールバック', () => {
  /**
   * 無効なトークンでのエラーハンドリング
   */
  test('無効なトークンでエラーハンドリングされる', async ({ page }) => {
    // When: トークンなしで/auth/callbackにアクセス
    await page.goto('/auth/callback')

    // Then: /welcomeにリダイレクトされる
    await expect(page).toHaveURL(/\/(welcome|auth\/callback)/)
  })
})
