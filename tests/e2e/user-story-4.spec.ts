/**
 * ファイル名: user-story-4.spec.ts
 *
 * 【概要】
 * User Story 4（簡易認証機能）のE2Eテスト
 * spec.mdの5つの受入シナリオをすべてテストケース化
 *
 * 【テスト対象】
 * - 初回訪問時のウェルカム画面表示
 * - 表示名入力による匿名サインイン
 * - セッション維持（ログイン状態の保持）
 * - ブラウザ再起動後のセッション維持
 * - ログアウト機能
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 * - spec.md: User Story 4の受入シナリオ定義
 */

import { test, expect } from '@playwright/test'

/**
 * テストスイート: User Story 4 - 簡易認証機能（匿名ログイン）
 *
 * 【設計根拠】spec.md User Story 4の5つの受入シナリオ
 */
test.describe('User Story 4: 簡易認証機能（匿名ログイン）', () => {
  /**
   * T166: シナリオ1 - 初回訪問時のウェルカム画面表示
   *
   * Given: 初回訪問のユーザーがアプリを開く
   * When: ホーム画面にアクセスする
   * Then: 「ゆるぼへようこそ」という簡易登録画面が表示され、表示名入力フィールドと「はじめる」ボタンが表示される
   */
  test('T166: 初回訪問時に「ゆるぼへようこそ」画面が表示される', async ({ page }) => {
    // Given: 初回訪問（セッションなし）
    await page.context().clearCookies()

    // When: ホーム画面にアクセス
    await page.goto('')

    // Then: ウェルカム画面が表示される
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()

    // Then: 表示名入力フィールドが表示される
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
    await expect(page.locator('label:has-text("表示名")')).toBeVisible()

    // Then: 「はじめる」ボタンが表示される
    await expect(page.locator('button:has-text("はじめる")')).toBeVisible()

    // Then: 説明文が表示される
    await expect(page.locator('text=表示名を入力してはじめましょう')).toBeVisible()
  })

  /**
   * T167: シナリオ2 - 表示名入力による匿名サインイン
   *
   * Given: 簡易登録画面が表示されている
   * When: 表示名「テストユーザー」を入力して「はじめる」ボタンを押す
   * Then: 自動的にユーザーが作成され、ログイン状態となり、タイムライン画面に遷移する
   */
  test('T167: 表示名を入力して「はじめる」を押すとタイムライン画面に遷移する', async ({ page }) => {
    // Given: ウェルカム画面が表示されている
    await page.context().clearCookies()
    await page.goto('/welcome')
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()

    // When: 表示名を入力
    const displayNameInput = page.locator('input[type="text"]').first()
    await displayNameInput.fill('テストユーザー')

    // When: 「はじめる」ボタンをクリック
    await page.locator('button:has-text("はじめる")').click()

    // Then: タイムライン画面に遷移する
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1:has-text("タイムライン")')).toBeVisible()

    // Then: ログアウトボタンが表示される（ログイン状態の証明）
    await expect(page.locator('button:has-text("ログアウト")')).toBeVisible()
  })

  /**
   * T168: シナリオ3 - セッション維持（ログイン済みユーザーの直接アクセス）
   *
   * Given: ログイン済みのユーザーがアプリを開く
   * When: ホーム画面にアクセスする
   * Then: 登録画面をスキップし、直接タイムライン画面が表示される（セッション維持）
   */
  test('T168: ログイン済みユーザーは登録画面をスキップしてタイムラインが表示される', async ({ page }) => {
    // Given: ログイン済み状態を作成
    await page.context().clearCookies()
    await page.goto('/welcome')
    await page.locator('input[type="text"]').first().fill('テストユーザー2')
    await page.locator('button:has-text("はじめる")').click()
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
   * T168-2: シナリオ4 - ブラウザ再起動後のセッション維持
   *
   * Given: ログイン済みのユーザーがアプリを使用している
   * When: ブラウザを閉じて再度開く
   * Then: ログイン状態が維持され、再度登録画面は表示されない
   *
   * 注: Playwrightでは新しいコンテキストを作成してブラウザ再起動をシミュレート
   */
  test('T168-2: ブラウザ再起動後もログイン状態が維持される', async ({ browser }) => {
    // Given: 最初のセッションでログイン
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto('/welcome')
    await page1.locator('input[type="text"]').first().fill('テストユーザー3')
    await page1.locator('button:has-text("はじめる")').click()
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
   * T169: シナリオ5 - ログアウト機能
   *
   * Given: ログイン済みのユーザー
   * When: 設定画面から「ログアウト」ボタンを押す
   * Then: ログアウトし、次回アクセス時に登録画面が再表示される
   */
  test('T169: ログアウトボタンを押すとログアウトし、次回アクセス時に登録画面が表示される', async ({ page }) => {
    // Given: ログイン済み状態
    await page.context().clearCookies()
    await page.goto('/welcome')
    await page.locator('input[type="text"]').first().fill('テストユーザー4')
    await page.locator('button:has-text("はじめる")').click()
    await expect(page).toHaveURL('/')

    // When: ログアウトボタンをクリック
    await page.locator('button:has-text("ログアウト")').first().click()

    // Then: 確認ダイアログが表示される（T174）
    await expect(page.locator('text=ログアウトしますか？')).toBeVisible()
    await expect(page.locator('text=現在のイベント投稿・つながりリストは引き継がれません')).toBeVisible()

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
   * T170: エッジケース - セッション有効期限切れ
   *
   * Given: セッションが有効期限切れ
   * When: ホーム画面にアクセスする
   * Then: 自動的に登録画面が表示される
   *
   * 注: 実際のセッション有効期限は24時間以上のため、このテストではCookieを削除してシミュレート
   */
  test('T170: セッション有効期限切れ時に自動的に登録画面が表示される', async ({ page }) => {
    // Given: ログイン後、Cookieを削除してセッション有効期限切れをシミュレート
    await page.context().clearCookies()
    await page.goto('/welcome')
    await page.locator('input[type="text"]').first().fill('テストユーザー5')
    await page.locator('button:has-text("はじめる")').click()
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
   * T171-T172: バリデーションエラーテスト（エッジケース）
   *
   * 表示名が空または50文字を超える場合のバリデーションエラー
   */
  test('T171: 表示名が空の場合、ボタンが無効化される', async ({ page }) => {
    // Given: ウェルカム画面が表示されている
    await page.context().clearCookies()
    await page.goto('/welcome')

    // Then: HTML5のrequired属性によりボタンが無効化されている
    const submitButton = page.locator('button:has-text("はじめる")')
    await expect(submitButton).toBeDisabled()
  })

  test('T172: 表示名が50文字を超える場合、入力が制限される', async ({ page }) => {
    // Given: ウェルカム画面が表示されている
    await page.context().clearCookies()
    await page.goto('/welcome')

    // When: 51文字の表示名を入力
    const longName = 'あ'.repeat(51)
    const displayNameInput = page.locator('input[type="text"]').first()
    await displayNameInput.fill(longName)

    // Then: maxLength属性により50文字までしか入力できない
    const inputValue = await displayNameInput.inputValue()
    expect(inputValue.length).toBeLessThanOrEqual(50)
  })
})
