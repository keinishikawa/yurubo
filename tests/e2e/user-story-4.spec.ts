/**
 * ファイル名: user-story-4.spec.ts
 *
 * 【概要】
 * 認証機能のE2Eテスト
 * Magic Link認証への移行に伴い更新
 *
 * 【テスト対象】
 * - 初回訪問時のウェルカム画面表示
 * - Magic Link認証フロー
 * - セッション維持（ログイン状態の保持）
 * - ブラウザ再起動後のセッション維持
 * - ログアウト機能
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 *
 * @see Issue #51 - Phase 0: 認証機能の修正（Magic Link認証への移行）
 */

import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

/**
 * テストスイート: 認証機能（Magic Link）
 *
 * 【設計根拠】Issue #51の完了条件
 */
test.describe('認証機能（Magic Link）', () => {
  /**
   * 初回訪問時のウェルカム画面表示
   *
   * Given: 初回訪問のユーザーがアプリを開く
   * When: ホーム画面にアクセスする
   * Then: 「ゆるぼへようこそ」画面が表示され、メールアドレス入力フィールドと送信ボタンが表示される
   */
  test('初回訪問時に「ゆるぼへようこそ」画面が表示される', async ({ page }) => {
    // Given: 初回訪問（セッションなし）
    await page.context().clearCookies()

    // When: ホーム画面にアクセス
    await page.goto('')

    // Then: ウェルカム画面が表示される
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()

    // Then: メールアドレス入力フィールドが表示される
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('label:has-text("メールアドレス")')).toBeVisible()

    // Then: 「ログインリンクを送信」ボタンが表示される
    await expect(page.locator('button:has-text("ログインリンクを送信")')).toBeVisible()
  })

  /**
   * Magic Link認証フロー
   *
   * Given: ウェルカム画面が表示されている
   * When: メールアドレスを入力してMagic Linkを送信し、リンクをクリックする
   * Then: ログイン状態となり、タイムライン画面に遷移する
   */
  test('Magic Linkでログインするとタイムライン画面に遷移する', async ({ page }) => {
    // Magic Link認証を実行
    await signIn(page, 'テストユーザー')

    // Then: タイムライン画面に遷移する
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1:has-text("タイムライン")')).toBeVisible()

    // Then: ログアウトボタンが表示される（ログイン状態の証明）
    await expect(page.locator('button:has-text("ログアウト")')).toBeVisible()
  })

  /**
   * セッション維持（ログイン済みユーザーの直接アクセス）
   *
   * Given: ログイン済みのユーザーがアプリを開く
   * When: ホーム画面にアクセスする
   * Then: 登録画面をスキップし、直接タイムライン画面が表示される（セッション維持）
   */
  test('ログイン済みユーザーは登録画面をスキップしてタイムラインが表示される', async ({ page }) => {
    // Given: ログイン済み状態を作成
    await signIn(page, 'セッションテストユーザー')
    await expect(page).toHaveURL('/')

    // When: 再度ホーム画面にアクセス（ページリロード）
    await page.reload()

    // Then: タイムライン画面が直接表示される（ウェルカム画面にリダイレクトされない）
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1:has-text("タイムライン")')).toBeVisible()

    // Then: ログアウトボタンが表示される
    await expect(page.locator('button:has-text("ログアウト")')).toBeVisible()
  })

  /**
   * ブラウザ再起動後のセッション維持
   *
   * Given: ログイン済みのユーザーがアプリを使用している
   * When: ブラウザを閉じて再度開く
   * Then: ログイン状態が維持され、再度登録画面は表示されない
   *
   * 注: Playwrightでは新しいコンテキストを作成してブラウザ再起動をシミュレート
   */
  test('ブラウザ再起動後もログイン状態が維持される', async ({ browser }) => {
    // Given: 最初のセッションでログイン
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await signIn(page1, 'ブラウザ再起動テストユーザー')
    await expect(page1).toHaveURL('/')

    // セッションCookieを保存
    const cookies = await context1.cookies()
    await context1.close()

    // When: 新しいブラウザコンテキスト（再起動シミュレート）でCookieを復元
    const context2 = await browser.newContext()
    await context2.addCookies(cookies)
    const page2 = await context2.newPage()
    await page2.goto('')

    // Then: タイムライン画面が表示される（ログイン状態維持）
    await expect(page2).toHaveURL('/')
    await expect(page2.locator('h1:has-text("タイムライン")')).toBeVisible()
    await expect(page2.locator('button:has-text("ログアウト")')).toBeVisible()

    await context2.close()
  })

  /**
   * ログアウト機能
   *
   * Given: ログイン済みのユーザー
   * When: 「ログアウト」ボタンを押す
   * Then: ログアウトし、次回アクセス時に登録画面が再表示される
   */
  test('ログアウトボタンを押すとログアウトし、次回アクセス時に登録画面が表示される', async ({ page }) => {
    // Given: ログイン済み状態
    await signIn(page, 'ログアウトテストユーザー')
    await expect(page).toHaveURL('/')

    // When: ログアウトボタンをクリック
    await page.locator('button:has-text("ログアウト")').first().click()

    // Then: 確認ダイアログが表示される
    await expect(page.locator('text=ログアウトしますか？')).toBeVisible()

    // When: ダイアログで「ログアウト」を確定
    await page.locator('button:has-text("ログアウト")').last().click()

    // Then: ウェルカム画面にリダイレクトされる
    await expect(page).toHaveURL('/welcome')
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()

    // Then: 次回アクセス時も登録画面が表示される
    await page.goto('')
    await expect(page).toHaveURL('/welcome')
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()
  })

  /**
   * セッション有効期限切れ
   *
   * Given: セッションが有効期限切れ
   * When: ホーム画面にアクセスする
   * Then: 自動的に登録画面が表示される
   *
   * 注: 実際のセッション有効期限は24時間以上のため、このテストではCookieを削除してシミュレート
   */
  test('セッション有効期限切れ時に自動的に登録画面が表示される', async ({ page }) => {
    // Given: ログイン後、Cookieを削除してセッション有効期限切れをシミュレート
    await signIn(page, 'セッション期限切れテストユーザー')
    await expect(page).toHaveURL('/')

    // セッション有効期限切れをシミュレート（Cookieを削除）
    await page.context().clearCookies()

    // When: ホーム画面にアクセス
    await page.goto('')

    // Then: 自動的にウェルカム画面にリダイレクトされる
    await expect(page).toHaveURL('/welcome')
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()
  })

  /**
   * バリデーションエラーテスト（メールアドレスが空の場合）
   */
  test('メールアドレスが空の場合、ボタンが無効化される', async ({ page }) => {
    // Given: ウェルカム画面が表示されている
    await page.context().clearCookies()
    await page.goto('/welcome')

    // Then: HTML5のrequired属性によりボタンが無効化されている
    const submitButton = page.locator('button:has-text("ログインリンクを送信")')
    await expect(submitButton).toBeDisabled()
  })
})
