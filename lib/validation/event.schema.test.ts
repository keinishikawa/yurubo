// @ts-nocheck
/**
 * ファイル名: event.schema.test.ts
 *
 * 【概要】
 * イベントバリデーションスキーマの単体テスト
 * Zodスキーマの正常系・異常系を網羅的にテスト
 *
 * 【処理フロー】
 * 1. テストデータを準備（正常データ・異常データ）
 * 2. schema.safeParse()でバリデーション実行
 * 3. 結果を検証（success/error、エラーメッセージ）
 *
 * 【主要テストケース】
 * - 正常系: すべてのフィールドが正しい場合
 * - 異常系: タイトル長さ制限、日時の前後関係、人数・予算の大小関係
 *
 * 【依存関係】
 * - @jest/globals: Jestテストフレームワーク
 * - ./event.schema: テスト対象のスキーマ
 */

import { describe, it, expect } from '@jest/globals'
import { createEventSchema, categorySchema } from './event.schema'

/**
 * 日付をdatetime-local形式（YYYY-MM-DDTHH:MM）に変換
 *
 * @param date - Date オブジェクト
 * @returns YYYY-MM-DDTHH:MM形式の文字列
 */
function toDateTimeLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * カテゴリスキーマのテスト
 */
describe('categorySchema', () => {
  /**
   * 正常系: 有効なカテゴリ値
   */
  it('有効なカテゴリ値を受け入れる', () => {
    // Arrange: 有効なカテゴリ値を準備
    const validCategories = ['drinking', 'travel', 'tennis', 'other']

    // Act & Assert: すべての有効値がバリデーションを通過
    validCategories.forEach((category) => {
      const result = categorySchema.safeParse(category)
      expect(result.success).toBe(true)
    })
  })

  /**
   * 異常系: 無効なカテゴリ値
   */
  it('無効なカテゴリ値を拒否する', () => {
    // Arrange: 無効なカテゴリ値を準備
    const invalidCategory = 'invalid_category'

    // Act: バリデーション実行
    const result = categorySchema.safeParse(invalidCategory)

    // Assert: バリデーションエラー
    expect(result.success).toBe(false)
    if (!result.success) {
      // Zodのデフォルトエラーメッセージを確認（英語）
      expect(result.error.issues[0].message).toContain('Invalid')
    }
  })
})

/**
 * イベント作成スキーマのテスト
 */
describe('createEventSchema', () => {
  /**
   * 正常系テストケース
   */
  describe('正常系', () => {
    /**
     * 必須フィールドのみ（最小構成）
     */
    it('必須フィールドのみで作成可能', () => {
      // Arrange: 必須フィールドのみのテストデータ
      const validData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)), // 明日
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)), // 明後日
        capacity_min: 2,
        capacity_max: 5,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(validData)

      // Assert: バリデーション成功
      expect(result.success).toBe(true)
    })

    /**
     * すべてのフィールドを含む（最大構成）
     */
    it('すべてのフィールドを含むデータを受け入れる', () => {
      // Arrange: すべてのフィールドを含むテストデータ
      const validData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)),
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)),
        capacity_min: 2,
        capacity_max: 5,
        price_min: 3000,
        price_max: 5000,
        comment: 'よろしくお願いします',
        deadline: new Date(Date.now() + 43200000).toISOString(), // 12時間後
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(validData)

      // Assert: バリデーション成功
      expect(result.success).toBe(true)
    })
  })

  /**
   * 異常系テストケース: タイトル
   */
  describe('タイトルのバリデーション', () => {
    /**
     * タイトルが空文字の場合
     */
    it('タイトルが空の場合エラー', () => {
      // Arrange: タイトルが空のテストデータ
      const invalidData = {
        title: '',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)),
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)),
        capacity_min: 2,
        capacity_max: 5,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('タイトルを入力してください')
      }
    })

    /**
     * タイトルが51文字以上の場合
     */
    it('タイトルが50文字を超える場合エラー', () => {
      // Arrange: 51文字のタイトル
      const invalidData = {
        title: 'あ'.repeat(51), // 51文字
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)),
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)),
        capacity_min: 2,
        capacity_max: 5,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('タイトルは50文字以内で入力してください')
      }
    })
  })

  /**
   * 異常系テストケース: 日時
   */
  describe('日時のバリデーション', () => {
    /**
     * 開始日時が過去の場合
     */
    it('開始日時が過去の場合エラー', () => {
      // Arrange: 過去の開始日時
      const invalidData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() - 86400000)), // 昨日
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000)),
        capacity_min: 2,
        capacity_max: 5,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '開始日時は現在時刻より未来を選択してください'
        )
      }
    })

    /**
     * 終了日時が開始日時より前の場合
     */
    it('終了日時が開始日時より前の場合エラー', () => {
      // Arrange: 終了日時 < 開始日時
      const invalidData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)), // 明後日
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000)), // 明日
        capacity_min: 2,
        capacity_max: 5,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '終了日時は開始日時より未来を選択してください'
        )
      }
    })
  })

  /**
   * 異常系テストケース: 参加人数
   */
  describe('参加人数のバリデーション', () => {
    /**
     * 最小参加人数が0以下の場合
     */
    it('最小参加人数が0の場合エラー', () => {
      // Arrange: capacity_min = 0
      const invalidData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)),
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)),
        capacity_min: 0,
        capacity_max: 5,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('最小参加人数は2人以上で入力してください')
      }
    })

    /**
     * 最大参加人数が最小参加人数より小さい場合
     */
    it('最大参加人数が最小参加人数より小さい場合エラー', () => {
      // Arrange: capacity_max < capacity_min
      const invalidData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)),
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)),
        capacity_min: 5,
        capacity_max: 2,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '最大参加人数は最小参加人数以上で入力してください'
        )
      }
    })
  })

  /**
   * 異常系テストケース: 予算
   */
  describe('予算のバリデーション', () => {
    /**
     * 最小予算が負の値の場合
     */
    it('最小予算が負の値の場合エラー', () => {
      // Arrange: price_min = -100
      const invalidData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)),
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)),
        capacity_min: 2,
        capacity_max: 5,
        price_min: -100,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('最小予算は0円以上で入力してください')
      }
    })

    /**
     * 最大予算が最小予算より小さい場合
     */
    it('最大予算が最小予算より小さい場合エラー', () => {
      // Arrange: price_max < price_min
      const invalidData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)),
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)),
        capacity_min: 2,
        capacity_max: 5,
        price_min: 5000,
        price_max: 3000,
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('最大予算は最小予算以上で入力してください')
      }
    })
  })

  /**
   * 異常系テストケース: 備考
   */
  describe('備考のバリデーション', () => {
    /**
     * 備考が500文字を超える場合
     */
    it('備考が500文字を超える場合エラー', () => {
      // Arrange: 501文字の備考
      const invalidData = {
        title: 'テストイベント',
        category: 'drinking' as const,
        date_start: toDateTimeLocal(new Date(Date.now() + 86400000)),
        date_end: toDateTimeLocal(new Date(Date.now() + 86400000 * 2)),
        capacity_min: 2,
        capacity_max: 5,
        comment: 'あ'.repeat(501), // 501文字
      }

      // Act: バリデーション実行
      const result = createEventSchema.safeParse(invalidData)

      // Assert: バリデーションエラー
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('備考は500文字以内で入力してください')
      }
    })
  })
})
