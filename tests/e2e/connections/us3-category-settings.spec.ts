/**
 * ファイル名: us3-category-settings.spec.ts
 *
 * 【概要】
 * User Story 3（アクティビティ単位の関係設定）のE2Eテスト
 * つながりごとにカテゴリ（飲み・旅行・スポーツ等）を設定できる機能をテスト
 *
 * 【テスト対象】
 * - カテゴリ編集画面表示
 * - カテゴリチェックボックス操作
 * - カテゴリ設定保存
 * - 設定の再表示での反映確認
 *
 * 【依存関係】
 * - Playwright: E2Eテストフレームワーク
 * - spec.md: User Story 3の受入シナリオ定義
 */

import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cleanupForTestIsolation, isSeedAvailable } from '../helpers/seed'

// テスト用のSupabaseクライアント（Service Role Key使用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

/**
 * テストスイート: User Story 3 - アクティビティ単位の関係設定
 *
 * 【Goal】カテゴリ編集画面でチェック→保存→再表示で反映確認
 *
 * 【設計根拠】
 * - spec.md US3の受入シナリオ
 * - 自分が設定したカテゴリのみ表示（enabled_categories）
 * - カテゴリ設定の保存と再読み込み
 */
/**
 * NOTE: このテストはUS4（つながりリストページ）の実装後に有効化する
 * 現時点では /connections ページが存在しないためスキップ
 */
test.describe.skip('User Story 3: アクティビティ単位の関係設定', () => {
  let testUserAId: string
  let testUserBId: string

  /**
   * テスト開始前にテストデータをクリーンアップ（Test Isolation）
   * @see Issue #25 - E2Eテスト間のデータ分離
   */
  test.beforeEach(async () => {
    if (isSeedAvailable()) {
      await cleanupForTestIsolation();
    }
  });

  /**
   * テスト前のセットアップ
   * - テストユーザーを作成
   * - つながりを成立させる
   */
  test.beforeAll(async () => {
    // テストユーザーAを作成（全カテゴリ有効）
    const userAId = crypto.randomUUID()
    const { error: userAError } = await supabase.from('users').insert({
      id: userAId,
      display_name: 'カテゴリテストユーザーA',
      enabled_categories: ['drinking', 'travel', 'tennis', 'other'],
    })
    if (userAError) throw new Error(`Failed to create user A: ${userAError.message}`)
    testUserAId = userAId

    // テストユーザーBを作成（飲み・旅行のみ有効）
    const userBId = crypto.randomUUID()
    const { error: userBError } = await supabase.from('users').insert({
      id: userBId,
      display_name: 'カテゴリテストユーザーB',
      enabled_categories: ['drinking', 'travel'],
    })
    if (userBError) throw new Error(`Failed to create user B: ${userBError.message}`)
    testUserBId = userBId

    // つながりを成立させる（双方向）
    const defaultCategoryFlags = {
      drinking: false,
      travel: false,
      tennis: false,
      other: false,
    }

    const { error: connAtoB } = await supabase.from('connections').insert({
      user_id: testUserAId,
      target_id: testUserBId,
      category_flags: defaultCategoryFlags,
    })
    if (connAtoB) throw new Error(`Failed to create connection A->B: ${connAtoB.message}`)

    const { error: connBtoA } = await supabase.from('connections').insert({
      user_id: testUserBId,
      target_id: testUserAId,
      category_flags: defaultCategoryFlags,
    })
    if (connBtoA) throw new Error(`Failed to create connection B->A: ${connBtoA.message}`)
  })

  /**
   * テスト後のクリーンアップ
   */
  test.afterAll(async () => {
    // つながりを削除
    await supabase.from('connections').delete().eq('user_id', testUserAId)
    await supabase.from('connections').delete().eq('user_id', testUserBId)

    // ユーザーを削除
    await supabase.from('users').delete().eq('id', testUserAId)
    await supabase.from('users').delete().eq('id', testUserBId)
  })

  /**
   * 認証ヘルパー: 匿名ログインを実行
   * 実際にはauth.usersテーブルにユーザーがいないため、
   * 既存のテストユーザーにログインする仕組みが必要
   *
   * Note: このテストはモック認証を使用
   */
  async function signIn(page: Page, displayName: string) {
    await page.context().clearCookies()
    await page.goto('/welcome')
    await expect(page.locator('text=ゆるぼへようこそ')).toBeVisible()
    await page.locator('input[type="text"]').first().fill(displayName)

    await Promise.all([
      page.waitForURL('/'),
      page.locator('button:has-text("はじめる")').click()
    ])

    await expect(page.locator('h1:has-text("タイムライン")')).toBeVisible()
  }

  /**
   * T027-1: カテゴリ編集画面表示
   *
   * Given: ユーザーAがログインしていて、ユーザーBとつながりがある
   * When: つながりリストからユーザーBのカテゴリ編集ボタンをクリック
   * Then: カテゴリ編集画面（CategoryEditor）が表示される
   * And: 自分（ユーザーA）のenabled_categoriesに含まれるカテゴリのみ表示される
   */
  test('T027-1: カテゴリ編集画面が表示され、自分のカテゴリのみ表示される', async ({ page }) => {
    // Given: ログイン
    await signIn(page, 'カテゴリテストユーザーA')

    // When: つながりページに移動
    await page.goto('/connections')
    await expect(page.locator('h1:has-text("つながりリスト")')).toBeVisible()

    // When: ユーザーBのカード内の編集ボタンをクリック
    const userBCard = page.locator('[data-testid="connection-card"]').filter({
      hasText: 'カテゴリテストユーザーB'
    })
    await expect(userBCard).toBeVisible()
    await userBCard.locator('[data-testid="edit-categories-button"]').click()

    // Then: CategoryEditorが表示される
    await expect(page.locator('[data-testid="category-editor"]')).toBeVisible()

    // Then: ユーザーAのenabled_categories（全4カテゴリ）が表示される
    await expect(page.locator('label:has-text("飲み")')).toBeVisible()
    await expect(page.locator('label:has-text("旅行")')).toBeVisible()
    await expect(page.locator('label:has-text("テニス")')).toBeVisible()
    await expect(page.locator('label:has-text("その他")')).toBeVisible()
  })

  /**
   * T027-2: カテゴリチェックボックス操作
   *
   * Given: カテゴリ編集画面が開いている
   * When: 「飲み」カテゴリのチェックボックスをONにする
   * Then: チェックボックスがON状態になる
   * And: 保存ボタンが有効になる
   */
  test('T027-2: カテゴリチェックボックスをON/OFF切り替えできる', async ({ page }) => {
    // Given: ログイン + つながりページ
    await signIn(page, 'カテゴリテストユーザーA')
    await page.goto('/connections')

    // カテゴリ編集を開く
    const userBCard = page.locator('[data-testid="connection-card"]').filter({
      hasText: 'カテゴリテストユーザーB'
    })
    await userBCard.locator('[data-testid="edit-categories-button"]').click()

    // Given: 初期状態では全てOFF
    const drinkingCheckbox = page.locator('[data-testid="category-checkbox-drinking"]')
    await expect(drinkingCheckbox).not.toBeChecked()

    // When: 「飲み」をONにする
    await drinkingCheckbox.click()

    // Then: チェックされた状態になる
    await expect(drinkingCheckbox).toBeChecked()
  })

  /**
   * T027-3: カテゴリ設定の保存
   *
   * Given: カテゴリ編集画面で「飲み」「旅行」をONにした
   * When: 保存ボタンをクリック
   * Then: 「カテゴリを更新しました」のトースト通知が表示される
   * And: 編集画面が閉じる
   */
  test('T027-3: カテゴリ設定を保存すると成功トーストが表示される', async ({ page }) => {
    // Given: ログイン + つながりページ
    await signIn(page, 'カテゴリテストユーザーA')
    await page.goto('/connections')

    // カテゴリ編集を開く
    const userBCard = page.locator('[data-testid="connection-card"]').filter({
      hasText: 'カテゴリテストユーザーB'
    })
    await userBCard.locator('[data-testid="edit-categories-button"]').click()

    // When: 「飲み」「旅行」をONにする
    await page.locator('[data-testid="category-checkbox-drinking"]').click()
    await page.locator('[data-testid="category-checkbox-travel"]').click()

    // When: 保存ボタンをクリック
    await page.locator('[data-testid="save-categories-button"]').click()

    // Then: 成功トーストが表示される
    await expect(page.locator('text=カテゴリを更新しました')).toBeVisible({ timeout: 5000 })

    // Then: エディターが閉じる（またはカードに戻る）
    await expect(page.locator('[data-testid="category-editor"]')).not.toBeVisible()
  })

  /**
   * T027-4: 保存後の再表示で反映確認
   *
   * Given: カテゴリ設定を保存した後
   * When: 再度カテゴリ編集画面を開く
   * Then: 保存したカテゴリ設定（飲み・旅行がON）が反映されている
   */
  test('T027-4: 保存後に再表示すると設定が反映されている', async ({ page }) => {
    // Given: 先にカテゴリを設定する
    await signIn(page, 'カテゴリテストユーザーA')
    await page.goto('/connections')

    const userBCard = page.locator('[data-testid="connection-card"]').filter({
      hasText: 'カテゴリテストユーザーB'
    })
    await userBCard.locator('[data-testid="edit-categories-button"]').click()

    // 飲み・旅行をONにして保存
    const drinkingCheckbox = page.locator('[data-testid="category-checkbox-drinking"]')
    const travelCheckbox = page.locator('[data-testid="category-checkbox-travel"]')

    // 既にONならスキップ、OFFならクリック
    if (!await drinkingCheckbox.isChecked()) {
      await drinkingCheckbox.click()
    }
    if (!await travelCheckbox.isChecked()) {
      await travelCheckbox.click()
    }

    await page.locator('[data-testid="save-categories-button"]').click()
    await expect(page.locator('text=カテゴリを更新しました')).toBeVisible({ timeout: 5000 })

    // ページをリロード
    await page.reload()
    await expect(page.locator('h1:has-text("つながりリスト")')).toBeVisible()

    // When: 再度カテゴリ編集を開く
    const userBCardAfterReload = page.locator('[data-testid="connection-card"]').filter({
      hasText: 'カテゴリテストユーザーB'
    })
    await userBCardAfterReload.locator('[data-testid="edit-categories-button"]').click()

    // Then: 保存した設定が反映されている
    await expect(page.locator('[data-testid="category-checkbox-drinking"]')).toBeChecked()
    await expect(page.locator('[data-testid="category-checkbox-travel"]')).toBeChecked()
    await expect(page.locator('[data-testid="category-checkbox-tennis"]')).not.toBeChecked()
    await expect(page.locator('[data-testid="category-checkbox-other"]')).not.toBeChecked()
  })

  /**
   * T027-5: デフォルト設定確認（新規つながりは全カテゴリOFF）
   *
   * Given: 新しくつながりが成立した状態
   * When: カテゴリ編集画面を開く
   * Then: すべてのカテゴリがOFF状態である
   */
  test('T027-5: 新規つながりは全カテゴリがOFF状態', async ({ page }) => {
    // Given: ログイン + つながりページ
    await signIn(page, 'カテゴリテストユーザーA')
    await page.goto('/connections')

    // DBを直接リセット（テスト用）
    await supabase.from('connections').update({
      category_flags: {
        drinking: false,
        travel: false,
        tennis: false,
        other: false,
      }
    }).eq('user_id', testUserAId).eq('target_id', testUserBId)

    // ページをリロード
    await page.reload()

    // When: カテゴリ編集を開く
    const userBCard = page.locator('[data-testid="connection-card"]').filter({
      hasText: 'カテゴリテストユーザーB'
    })
    await userBCard.locator('[data-testid="edit-categories-button"]').click()

    // Then: すべてのカテゴリがOFF
    await expect(page.locator('[data-testid="category-checkbox-drinking"]')).not.toBeChecked()
    await expect(page.locator('[data-testid="category-checkbox-travel"]')).not.toBeChecked()
    await expect(page.locator('[data-testid="category-checkbox-tennis"]')).not.toBeChecked()
    await expect(page.locator('[data-testid="category-checkbox-other"]')).not.toBeChecked()
  })
})
