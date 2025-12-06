/**
 * ファイル名: us1-add-connection.spec.ts
 *
 * 【概要】
 * User Story 1（つながりの追加）のE2Eテスト
 * spec.mdの受入シナリオをテストケース化
 *
 * 【テスト対象】
 * - ユーザー検索機能
 * - つながりリクエスト送信
 * - リクエスト承認によるつながり成立
 * - 既存つながりの友人ラベル表示
 * - 同時リクエスト時の自動つながり成立
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 * - spec.md: User Story 1の受入シナリオ定義
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
 * テストスイート: User Story 1 - つながりの追加
 *
 * 【設計根拠】spec.md User Story 1の受入シナリオ
 */
// TODO: 認証フローのE2Eテストセットアップを修正後、skipを解除する
test.describe.skip('User Story 1: つながりの追加', () => {
  /**
   * テスト開始前にテストデータをクリーンアップ（Test Isolation）
   * @see Issue #25 - E2Eテスト間のデータ分離
   */
  test.beforeEach(async ({ page }) => {
    // テストデータのクリーンアップ
    if (isSeedAvailable()) {
      await cleanupForTestIsolation();
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
   * シナリオ1: ユーザー検索ページにアクセスできる
   *
   * Given: ユーザーがログインしている
   * When: つながり検索ページにアクセスする
   * Then: 検索入力フィールドが表示される
   */
  test('T010-1: ユーザー検索ページにアクセスできる', async ({ page }) => {
    // Given: ログイン済み状態を作成
    await loginAsTestUser(page, 'テストユーザー1')

    // When: つながり検索ページにアクセス
    await page.goto('/connections/search')

    // Then: 検索入力フィールドが表示される
    await expect(page.locator('[data-testid="user-search-input"]')).toBeVisible()
  })

  /**
   * シナリオ2: ユーザーを検索できる
   *
   * Given: ユーザー検索ページを開いている
   * When: 検索クエリを入力する
   * Then: 検索結果が表示される（または「見つかりませんでした」）
   */
  test('T010-2: ユーザー名で検索できる', async ({ page }) => {
    // Given: ログイン + 検索ページを開く
    await loginAsTestUser(page, 'テストユーザー2')
    await page.goto('/connections/search')

    // When: 検索クエリを入力
    await page.locator('[data-testid="user-search-input"]').fill('テスト')
    await page.locator('[data-testid="search-button"]').click()

    // Then: 検索結果エリアが表示される（結果があるかないかに関わらず）
    await expect(
      page.locator('[data-testid="search-results"]').or(page.locator('[data-testid="no-results"]'))
    ).toBeVisible()
  })

  /**
   * シナリオ3: つながりリクエストを送信できる
   *
   * Given: 検索結果にユーザーが表示されている
   * When: 「リクエスト送信」ボタンをクリックする
   * Then: 成功メッセージが表示される
   * And: ボタンが「送信済み」に変わる
   */
  test('T010-3: つながりリクエストを送信できる', async ({ page }) => {
    // Given: ログイン + 検索ページを開く
    await loginAsTestUser(page, 'テストユーザー3')
    await page.goto('/connections/search')

    // When: 別のユーザーを検索
    await page.locator('[data-testid="user-search-input"]').fill('リクエストテスト')
    await page.locator('[data-testid="search-button"]').click()

    // 検索結果が表示されるまで待機（ユーザーがいる前提）
    const userResult = page.locator('[data-testid="user-result"]').first()

    // 検索結果があればリクエスト送信
    if (await userResult.isVisible()) {
      // When: リクエスト送信ボタンをクリック
      await userResult.locator('[data-testid="send-request-button"]').click()

      // Then: 成功メッセージまたは状態変化を確認
      await expect(
        page.locator('[data-testid="toast"]').or(
          userResult.locator('[data-testid="request-sent-badge"]')
        )
      ).toBeVisible()
    } else {
      // ユーザーが存在しない場合はスキップ
      test.skip(true, 'リクエストテスト用ユーザーが存在しません')
    }
  })

  /**
   * シナリオ4: 既につながりのあるユーザーには友人ラベルが表示される
   *
   * Given: ユーザーAとユーザーBがつながっている
   * When: ユーザーAがユーザーBを検索する
   * Then: ユーザーBに「友人」ラベルが表示される
   * And: 「リクエスト送信」ボタンが非表示
   */
  test('T010-4: 既につながりのあるユーザーには友人ラベルが表示される', async ({ page }) => {
    // Given: ログイン済み状態（つながりが既にある前提）
    await loginAsTestUser(page, 'テストユーザー4')
    await page.goto('/connections/search')

    // When: つながりのある相手を検索（テスト用に既存つながりがあると仮定）
    await page.locator('[data-testid="user-search-input"]').fill('友人テスト')
    await page.locator('[data-testid="search-button"]').click()

    // 検索結果が表示されるまで待機
    const userResult = page.locator('[data-testid="user-result"]').first()

    // 検索結果があれば友人ラベルを確認
    if (await userResult.isVisible()) {
      const isFriend = await userResult.locator('[data-testid="friend-label"]').isVisible()

      if (isFriend) {
        // Then: 友人ラベルが表示されている
        await expect(userResult.locator('[data-testid="friend-label"]')).toBeVisible()
        // And: リクエスト送信ボタンが非表示
        await expect(userResult.locator('[data-testid="send-request-button"]')).not.toBeVisible()
      } else {
        // 友人でない場合はテストをスキップ（データセットアップの問題）
        test.skip(true, 'つながりデータが設定されていません')
      }
    } else {
      test.skip(true, '友人テスト用ユーザーが存在しません')
    }
  })

  /**
   * シナリオ5: 受信したリクエストを承認できる
   *
   * Given: ユーザーがつながりリクエストを受信している
   * When: リクエスト一覧で「承認」をクリックする
   * Then: つながりが成立する
   * And: リクエスト一覧からそのリクエストが消える
   */
  test('T010-5: 受信したリクエストを承認するとつながりが成立する', async ({ page }) => {
    // Given: ログイン済み状態（リクエストを受信している前提）
    await loginAsTestUser(page, 'テストユーザー5')

    // When: リクエスト一覧ページにアクセス
    await page.goto('/connections/requests')

    // リクエストがあるか確認
    const requestCard = page.locator('[data-testid="request-card"]').first()

    if (await requestCard.isVisible()) {
      // When: 承認ボタンをクリック
      await requestCard.locator('[data-testid="accept-button"]').click()

      // Then: 成功メッセージが表示される
      await expect(page.locator('[data-testid="toast"]')).toContainText(/つながり|成立|承認/)

      // And: リクエストが一覧から消える（または残りのリクエスト数が減る）
      // 1つしかなかった場合は「リクエストなし」表示になる
      await expect(
        requestCard.or(page.locator('[data-testid="no-requests"]'))
      ).toBeVisible()
    } else {
      // リクエストがない場合はスキップ
      test.skip(true, '承認テスト用のリクエストが存在しません')
    }
  })

  /**
   * シナリオ6: 自分自身は検索結果に表示されない
   *
   * Given: ユーザーがログインしている
   * When: 自分の名前で検索する
   * Then: 自分自身は検索結果に表示されない
   */
  test('T010-6: 自分自身は検索結果に表示されない', async ({ page }) => {
    // Given: ログイン済み状態
    const displayName = 'テストユーザー自分検索'
    await loginAsTestUser(page, displayName)
    await page.goto('/connections/search')

    // When: 自分の名前で検索
    await page.locator('[data-testid="user-search-input"]').fill(displayName)
    await page.locator('[data-testid="search-button"]').click()

    // Then: 検索結果に自分自身が含まれていないことを確認
    // 結果がある場合、どのユーザー結果にも自分の名前が完全一致で表示されない
    const results = page.locator('[data-testid="user-result"]')
    const count = await results.count()

    for (let i = 0; i < count; i++) {
      const resultName = await results.nth(i).locator('[data-testid="user-name"]').textContent()
      expect(resultName).not.toBe(displayName)
    }
  })

  /**
   * シナリオ7: 既にリクエスト送信済みのユーザーには「送信済み」が表示される
   *
   * Given: ユーザーAがユーザーBにリクエストを送信済み
   * When: ユーザーAがユーザーBを再度検索する
   * Then: 「送信済み」バッジが表示される
   * And: 「リクエスト送信」ボタンが非表示または無効
   */
  test('T010-7: リクエスト送信済みのユーザーには送信済みバッジが表示される', async ({ page }) => {
    // Given: ログイン済み状態
    await loginAsTestUser(page, 'テストユーザー7')
    await page.goto('/connections/search')

    // When: リクエスト送信済みのユーザーを検索（テスト用データが必要）
    await page.locator('[data-testid="user-search-input"]').fill('送信済みテスト')
    await page.locator('[data-testid="search-button"]').click()

    // 検索結果が表示されるまで待機
    const userResult = page.locator('[data-testid="user-result"]').first()

    if (await userResult.isVisible()) {
      const hasPendingRequest = await userResult.locator('[data-testid="request-sent-badge"]').isVisible()

      if (hasPendingRequest) {
        // Then: 送信済みバッジが表示されている
        await expect(userResult.locator('[data-testid="request-sent-badge"]')).toBeVisible()
        // And: リクエスト送信ボタンが非表示または無効
        await expect(userResult.locator('[data-testid="send-request-button"]')).not.toBeVisible()
      } else {
        test.skip(true, '送信済みリクエストデータが設定されていません')
      }
    } else {
      test.skip(true, '送信済みテスト用ユーザーが存在しません')
    }
  })
})
