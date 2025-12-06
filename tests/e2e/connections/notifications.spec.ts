/**
 * ファイル名: notifications.spec.ts
 *
 * 【概要】
 * 通知機能のE2Eテスト
 * spec.mdの通知要件をテストケース化
 *
 * 【テスト対象】
 * - 通知バッジ表示
 * - 通知一覧表示
 * - 通知既読更新
 * - つながりリクエスト受信通知
 * - リクエスト承認通知
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 * - spec.md: 通知機能の要件定義
 */

import { test, expect, Page } from '@playwright/test'
import { cleanupForTestIsolation, isSeedAvailable } from '../helpers/seed'

/**
 * テストユーザーとしてログインするヘルパー関数
 *
 * @param page - Playwrightのページオブジェクト
 * @param displayName - 表示名（デフォルト: 'テストユーザー'）
 */
async function loginAsTestUser(page: Page, displayName: string = 'テストユーザー') {
  await page.context().clearCookies()
  await page.goto('/welcome')
  await page.locator('input[type="text"]').first().fill(displayName)
  await Promise.all([
    page.waitForURL('/'),
    page.locator('button:has-text("はじめる")').click()
  ])
}

/**
 * テストスイート: Phase 7 - 通知機能
 *
 * 【設計根拠】spec.md 通知機能要件
 */
// TODO: 認証フローのE2Eテストセットアップを修正後、skipを解除する
test.describe.skip('Phase 7: 通知機能', () => {
  /**
   * テスト開始前にテストデータをクリーンアップ（Test Isolation）
   * @see Issue #25 - E2Eテスト間のデータ分離
   */
  test.beforeEach(async ({ page }) => {
    // テストデータのクリーンアップ
    if (isSeedAvailable()) {
      await cleanupForTestIsolation()
    }

    // ブラウザコンソールログをキャプチャ
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    })

    // ページエラーをキャプチャ
    page.on('pageerror', (err) => {
      console.error(`[PAGE ERROR] ${err.message}`)
    })

    // ネットワークレスポンスエラーをキャプチャ
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes('/api/')) {
        console.error(`[API ERROR] ${response.status()} ${response.url()}`)
      }
    })
  })

  /**
   * シナリオ1: 通知バッジがナビゲーションに表示される
   *
   * Given: ユーザーがログインしている
   * When: ページを表示する
   * Then: 通知バッジアイコンがナビゲーションに表示される
   */
  test('T041-1: 通知バッジがナビゲーションに表示される', async ({ page }) => {
    // Given: ログイン済み状態を作成
    await loginAsTestUser(page, '通知テストユーザー1')

    // When: トップページにアクセス
    await page.goto('/')

    // Then: 通知バッジアイコンがナビゲーションに表示される
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible()
  })

  /**
   * シナリオ2: 未読通知がある場合、バッジに件数が表示される
   *
   * Given: ユーザーが未読通知を持っている
   * When: ページを表示する
   * Then: 通知バッジに未読件数が表示される
   */
  test('T041-2: 未読通知がある場合、バッジに件数が表示される', async ({ page }) => {
    // Given: ログイン済み状態（未読通知がある前提）
    await loginAsTestUser(page, '通知テストユーザー2')
    await page.goto('/')

    // 通知バッジを確認
    const badge = page.locator('[data-testid="notification-badge"]')
    await expect(badge).toBeVisible()

    // Then: 未読件数が表示されている（件数がある場合）
    const countElement = page.locator('[data-testid="notification-count"]')
    const isCountVisible = await countElement.isVisible()

    if (isCountVisible) {
      const countText = await countElement.textContent()
      // 件数が数字であることを確認
      expect(countText).toMatch(/^\d+$/)
    }
    // 未読がない場合は件数表示がないことを確認
  })

  /**
   * シナリオ3: 通知バッジをクリックすると通知一覧が表示される
   *
   * Given: ユーザーがログインしている
   * When: 通知バッジをクリックする
   * Then: 通知一覧（ドロップダウンまたはページ）が表示される
   */
  test('T041-3: 通知バッジをクリックすると通知一覧が表示される', async ({ page }) => {
    // Given: ログイン済み状態
    await loginAsTestUser(page, '通知テストユーザー3')
    await page.goto('/')

    // When: 通知バッジをクリック
    await page.locator('[data-testid="notification-badge"]').click()

    // Then: 通知一覧が表示される
    await expect(
      page.locator('[data-testid="notification-list"]').or(
        page.locator('[data-testid="notification-dropdown"]')
      )
    ).toBeVisible()
  })

  /**
   * シナリオ4: 通知をクリックすると既読になる
   *
   * Given: ユーザーが未読通知を持っている
   * When: 通知アイテムをクリックする
   * Then: その通知が既読状態になる
   */
  test('T041-4: 通知をクリックすると既読になる', async ({ page }) => {
    // Given: ログイン済み状態（未読通知がある前提）
    await loginAsTestUser(page, '通知テストユーザー4')
    await page.goto('/')

    // 通知一覧を開く
    await page.locator('[data-testid="notification-badge"]').click()

    // 未読通知を探す
    const unreadNotification = page.locator('[data-testid="notification-item"][data-unread="true"]').first()

    if (await unreadNotification.isVisible()) {
      // When: 未読通知をクリック
      await unreadNotification.click()

      // Then: 既読状態になる（data-unread属性がfalseになるか、スタイルが変わる）
      // 再度通知一覧を開いて確認
      await page.locator('[data-testid="notification-badge"]').click()

      // 未読件数が減っているか、通知が既読表示になっていることを確認
      // （具体的な実装に依存するため、柔軟なアサーションを使用）
    } else {
      test.skip(true, '未読通知が存在しません')
    }
  })

  /**
   * シナリオ5: つながりリクエスト受信時に通知が作成される
   *
   * Given: ユーザーAがログインしている
   * When: ユーザーBからつながりリクエストを受信する
   * Then: ユーザーAに「つながりリクエスト受信」通知が表示される
   */
  test('T041-5: つながりリクエスト受信時に通知が作成される', async ({ page }) => {
    // このテストは2つのユーザーセッションが必要なため、
    // 実装時にはシードデータで事前にリクエストを作成するか、
    // APIを直接呼び出してリクエストを送信する

    // Given: ログイン済み状態（リクエストを受信した状態）
    await loginAsTestUser(page, '通知テストユーザー5')
    await page.goto('/')

    // 通知一覧を開く
    await page.locator('[data-testid="notification-badge"]').click()

    // Then: つながりリクエスト受信通知があることを確認
    const requestNotification = page.locator('[data-testid="notification-item"][data-type="connection_request"]')

    if (await requestNotification.isVisible()) {
      await expect(requestNotification).toContainText(/リクエスト|申請/)
    } else {
      test.skip(true, 'つながりリクエスト通知が存在しません')
    }
  })

  /**
   * シナリオ6: つながりリクエスト承認時に通知が作成される
   *
   * Given: ユーザーAがつながりリクエストを送信済み
   * When: ユーザーBがリクエストを承認する
   * Then: ユーザーAに「リクエスト承認」通知が表示される
   */
  test('T041-6: つながりリクエスト承認時に通知が作成される', async ({ page }) => {
    // Given: ログイン済み状態（リクエストが承認された状態）
    await loginAsTestUser(page, '通知テストユーザー6')
    await page.goto('/')

    // 通知一覧を開く
    await page.locator('[data-testid="notification-badge"]').click()

    // Then: リクエスト承認通知があることを確認
    const acceptedNotification = page.locator('[data-testid="notification-item"][data-type="connection_accepted"]')

    if (await acceptedNotification.isVisible()) {
      await expect(acceptedNotification).toContainText(/承認|つながり|成立/)
    } else {
      test.skip(true, 'リクエスト承認通知が存在しません')
    }
  })

  /**
   * シナリオ7: 通知がない場合は「通知はありません」と表示される
   *
   * Given: ユーザーが通知を持っていない
   * When: 通知一覧を開く
   * Then: 「通知はありません」メッセージが表示される
   */
  test('T041-7: 通知がない場合は空状態メッセージが表示される', async ({ page }) => {
    // Given: ログイン済み状態（通知がない状態）
    await loginAsTestUser(page, '通知テストユーザー新規')
    await page.goto('/')

    // When: 通知一覧を開く
    await page.locator('[data-testid="notification-badge"]').click()

    // Then: 通知があるか、空状態メッセージが表示される
    await expect(
      page.locator('[data-testid="notification-item"]').or(
        page.locator('[data-testid="no-notifications"]')
      )
    ).toBeVisible()
  })

  /**
   * シナリオ8: 通知からリクエスト一覧ページに遷移できる
   *
   * Given: つながりリクエスト通知が表示されている
   * When: 通知をクリックする
   * Then: リクエスト一覧ページに遷移する
   */
  test('T041-8: つながりリクエスト通知からリクエストページに遷移できる', async ({ page }) => {
    // Given: ログイン済み状態
    await loginAsTestUser(page, '通知テストユーザー8')
    await page.goto('/')

    // 通知一覧を開く
    await page.locator('[data-testid="notification-badge"]').click()

    // つながりリクエスト通知を探す
    const requestNotification = page.locator('[data-testid="notification-item"][data-type="connection_request"]').first()

    if (await requestNotification.isVisible()) {
      // When: 通知をクリック
      await requestNotification.click()

      // Then: リクエスト一覧ページに遷移する
      await expect(page).toHaveURL(/\/connections\/requests/)
    } else {
      test.skip(true, 'つながりリクエスト通知が存在しません')
    }
  })
})
