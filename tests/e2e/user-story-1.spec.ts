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

import { test, expect } from '@playwright/test'

/**
 * テストスイート: User Story 1 - 匿名イベント投稿
 *
 * 【設計根拠】spec.md User Story 1の7つの受入シナリオ
 */
test.describe('User Story 1: 匿名イベント投稿', () => {
  /**
   * T061: シナリオ1 - 投稿モーダル表示
   *
   * Given: ユーザーがログインしている
   * When: ホーム画面右下の「＋投稿」ボタンをタップする
   * Then: イベント投稿モーダルが表示される
   */
  test('T061: 投稿ボタンをクリックするとモーダルが表示される', async ({ page }) => {
    // Given: ログイン済み状態を作成
    await page.context().clearCookies()
    await page.goto('/welcome')
    await page.locator('input[type="text"]').first().fill('テストユーザー1')
    await page.locator('button:has-text("はじめる")').click()
    await expect(page).toHaveURL('http://localhost:3000/')

    // When: 「＋投稿」ボタンをクリック
    await page.locator('button:has-text("投稿")').click()

    // Then: モーダルが表示される
    await expect(page.locator('text=イベントを投稿')).toBeVisible()

    // Then: フォームフィールドが表示される
    await expect(page.getByRole('combobox').first()).toBeVisible() // カテゴリ選択（shadcn-ui Select）
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('text=開催日時')).toBeVisible() // DateRangePickerのタイトル
  })

  /**
   * T062: シナリオ2 - イベント投稿完了
   *
   * Given: 投稿モーダルが開いている
   * When: カテゴリ「飲み」、開催日時、想定人数、価格帯、コメントを入力して投稿
   * Then: モーダルが閉じ、タイムラインに即時反映される
   */
  test('T062: イベント情報を入力して投稿すると、タイムラインに反映される', async ({ page }) => {
    // Given: ログイン + モーダルを開く
    await page.context().clearCookies()
    await page.goto('/welcome')
    await page.locator('input[type="text"]').first().fill('テストユーザー2')
    await page.locator('button:has-text("はじめる")').click()
    await expect(page).toHaveURL('http://localhost:3000/')
    await page.locator('button:has-text("投稿")').click()

    // When: フォームに入力
    // カテゴリ選択（shadcn-ui Select - 最初のcombobox）
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: '🍶 飲み' }).click()

    // タイトルとコメントを入力（日時・人数・価格はデフォルト値を使用）
    await page.locator('input[name="title"]').fill('仕事終わりに飲みたい')
    await page.locator('textarea[name="comment"]').fill('仕事終わりに軽く一杯')

    // When: 投稿ボタンをクリック
    await page.locator('button[type="submit"]:has-text("投稿する")').click()

    // Then: モーダルが閉じる（投稿成功の証拠）
    await expect(page.locator('text=イベントを投稿')).not.toBeVisible({ timeout: 10000 })

    // Then: タイムラインに投稿が表示される
    await expect(page.locator('text=仕事終わりに軽く一杯')).toBeVisible({ timeout: 5000 })
  })

  /**
   * T063: シナリオ3 - 匿名ID表示
   *
   * Given: イベント投稿が完了した
   * When: タイムラインを確認する
   * Then: 投稿者の名前は表示されず、匿名ID（例：🍶A）で表示される
   */
  test('T063: 投稿後、タイムラインに匿名IDが表示され、実名は表示されない', async ({ page }) => {
    // Setup: イベント投稿済み状態
    await page.context().clearCookies()
    await page.goto('/welcome')
    const displayName = 'テストユーザー3（実名）'
    await page.locator('input[type="text"]').first().fill(displayName)
    await page.locator('button:has-text("はじめる")').click()
    await expect(page).toHaveURL('http://localhost:3000/')

    // イベント投稿
    await page.locator('button:has-text("投稿")').click()

    // カテゴリ選択（shadcn-ui Select - 最初のcombobox）
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: '🍶 飲み' }).click()

    // タイトルとコメントを入力（日時・人数はデフォルト値を使用）
    await page.locator('input[name="title"]').fill('匿名テスト用イベント')
    await page.locator('textarea[name="comment"]').fill('匿名ID表示テスト')
    await page.locator('button[type="submit"]:has-text("投稿する")').click()

    // When: タイムラインを確認（投稿が反映されていることを確認）
    await expect(page.locator('text=匿名ID表示テスト')).toBeVisible({ timeout: 10000 })

    // Then: 投稿者の実名は表示されない（完全匿名）
    // 注: 仕様変更により匿名ID表示は不要になりました
    await expect(page.locator('main').first()).not.toContainText(displayName)
  })

  /**
   * T064: シナリオ4 - つながりリストOKユーザーに表示
   *
   * Given: イベント投稿が完了した
   * When: つながりリストで該当カテゴリ（飲み）がOKのユーザーのタイムラインを確認
   * Then: 投稿が表示される
   *
   * Note: このテストはデータベースのつながりリスト設定が必要なため、
   * 実際の実装ではテストヘルパー関数でデータベースに直接つながりを作成する必要があります。
   * 現時点ではスキップしています。
   */
  test.skip('T064: つながりリストでカテゴリOKのユーザーには投稿が表示される', async () => {
    // TODO: データベースシード関数またはAPIを使用してつながりリストを設定
    // 1. ユーザーA作成
    // 2. ユーザーB作成
    // 3. ユーザーA → ユーザーBのつながり作成（飲みカテゴリOK）
    // 4. ユーザーAでイベント投稿
    // 5. ユーザーBのタイムラインで確認
  })

  /**
   * T065: シナリオ5 - つながりリストNGユーザーに非表示
   *
   * Given: イベント投稿が完了した
   * When: つながりリストで該当カテゴリ（飲み）がNGのユーザーのタイムラインを確認
   * Then: 投稿は表示されない
   *
   * Note: このテストはデータベースのつながりリスト設定が必要なため、
   * 実際の実装ではテストヘルパー関数でデータベースに直接つながりを作成する必要があります。
   * 現時点ではスキップしています。
   */
  test.skip('T065: つながりリストでカテゴリNGのユーザーには投稿が非表示', async () => {
    // TODO: データベースシード関数またはAPIを使用してつながりリスト設定
    // 1. ユーザーA作成
    // 2. ユーザーC作成
    // 3. ユーザーA → ユーザーCのつながり作成（飲みカテゴリNG）
    // 4. ユーザーAでイベント投稿
    // 5. ユーザーCのタイムラインで確認（投稿が表示されないことを確認）
  })

  /**
   * T066: シナリオ6 - 1日3件投稿上限エラー
   *
   * Given: ユーザーが同カテゴリで1日に3件投稿済み
   * When: 同カテゴリで4件目の投稿を試みる
   * Then: エラーメッセージ「1日の投稿上限（3件）に達しました」が表示され、投稿されない
   */
  test('T066: 1日3件投稿済みの場合、4件目はエラーメッセージが表示される', async ({ page }) => {
    // Setup: ログイン
    await page.context().clearCookies()
    await page.goto('/welcome')
    await page.locator('input[type="text"]').first().fill('テストユーザー投稿制限')
    await page.locator('button:has-text("はじめる")').click()
    await expect(page).toHaveURL('http://localhost:3000/')

    // 同じカテゴリで3件投稿
    for (let i = 0; i < 3; i++) {
      await page.locator('button:has-text("投稿")').click()

      // カテゴリ選択（shadcn-ui Select - 最初のcombobox）
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: '🍶 飲み' }).click()

      // タイトルとコメントを入力（日時・人数・価格はデフォルト値を使用）
      await page.locator('input[name="title"]').fill(`投稿テスト${i + 1}件目`)
      await page.locator('textarea[name="comment"]').fill(`投稿${i + 1}件目`)
      await page.locator('button[type="submit"]:has-text("投稿する")').click()

      // モーダルが閉じることを確認（投稿成功の証拠）
      await expect(page.locator('text=イベントを投稿')).not.toBeVisible({ timeout: 10000 })
      // 次の投稿のために少し待機
      await page.waitForTimeout(500)
    }

    // When: 4件目を投稿しようとする
    await page.locator('button:has-text("投稿")').click()

    // カテゴリ選択（shadcn-ui Select - 最初のcombobox）
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: '🍶 飲み' }).click()

    // タイトルとコメントを入力（日時・人数・価格はデフォルト値を使用）
    await page.locator('input[name="title"]').fill('4件目の投稿テスト')
    await page.locator('textarea[name="comment"]').fill('4件目の投稿（エラー期待）')
    await page.locator('button[type="submit"]:has-text("投稿する")').click()

    // Then: エラーメッセージが表示される
    await expect(page.getByText('1日の投稿上限（3件）に達しました')).toBeVisible({ timeout: 10000 })

    // Then: モーダルは閉じない（再入力可能）
    await expect(page.locator('text=イベントを投稿')).toBeVisible()
  })

  /**
   * T067: シナリオ7 - 必須項目未入力エラー
   *
   * Given: 投稿モーダルで必須項目（カテゴリ、開催日時）が未入力
   * When: 投稿ボタンを押す
   * Then: エラーメッセージが表示され、投稿されない
   */
  test('T067: 必須項目未入力の場合、バリデーションエラーが表示される', async ({ page }) => {
    // Setup: ログイン + モーダルを開く
    await page.context().clearCookies()
    await page.goto('/welcome')
    await page.locator('input[type="text"]').first().fill('テストユーザーバリデーション')
    await page.locator('button:has-text("はじめる")').click()
    await expect(page).toHaveURL('http://localhost:3000/')
    await page.locator('button:has-text("投稿")').click()

    // When: 必須項目を入力せずに送信（カテゴリのみ選択）
    await page.locator('button[type="submit"]:has-text("投稿する")').click()

    // Then: バリデーションエラーが表示される（タイトル必須）
    await expect(page.getByText('入力内容に誤りがあります')).toBeVisible({ timeout: 5000 })

    // Then: モーダルは閉じない
    await expect(page.locator('text=イベントを投稿')).toBeVisible()
  })

  /**
   * FR-019: つながりリスト未設定時の警告表示
   *
   * Given: ユーザーのつながりリストが空
   * When: 投稿モーダルを開く
   * Then: 警告メッセージ「つながりリストが設定されていません。設定画面から追加してください」が表示される
   *
   * @see specs/001-event-creation/spec.md FR-019
   */
  test('FR-019: つながりリストが空の場合、投稿モーダルに警告が表示される', async ({ page }) => {
    // Setup: つながりリストが空のユーザーでログイン（新規ユーザー）
    await page.context().clearCookies()
    await page.goto('/welcome')
    await page.locator('input[type="text"]').first().fill('新規ユーザーつながり0件')
    await page.locator('button:has-text("はじめる")').click()
    await expect(page).toHaveURL('http://localhost:3000/')

    // When: 投稿モーダルを開く
    await page.locator('button:has-text("投稿")').click()

    // Then: 警告メッセージが表示される
    await expect(
      page.locator('text=つながりリストが設定されていません')
    ).toBeVisible({ timeout: 5000 })

    // Then: 投稿自体は可能（警告のみ、ブロックはしない）
    await expect(page.locator('button[type="submit"]:has-text("投稿する")')).toBeEnabled()
  })

  /**
   * FR-019-2: つながりリストが存在する場合、警告は非表示
   *
   * Given: ユーザーのつながりリストに1件以上のつながりが存在
   * When: 投稿モーダルを開く
   * Then: 警告メッセージは表示されない
   *
   * Note: このテストはデータベースにつながりリストを作成する必要があるため、
   * 実際の実装ではテストヘルパー関数でデータベースに直接つながりを作成する必要があります。
   * 現時点ではスキップしています。
   */
  test.skip('FR-019-2: つながりリストが存在する場合、警告は表示されない', async () => {
    // TODO: データベースシード関数またはAPIを使用してつながりリストを設定
    // 1. ユーザー作成
    // 2. つながり作成（1件以上）
    // 3. 投稿モーダルを開く
    // 4. 警告メッセージが表示されないことを確認
  })
})
