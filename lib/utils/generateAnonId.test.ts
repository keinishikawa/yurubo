// @ts-nocheck
/**
 * ファイル名: generateAnonId.test.ts
 *
 * 【概要】
 * 匿名ID生成ロジックの単体テスト
 * カテゴリ絵文字とアルファベット変換の正常動作を検証
 *
 * 【処理フロー】
 * 1. テストデータを準備（カテゴリ、投稿数）
 * 2. generateAnonId()を実行
 * 3. 期待値と比較
 *
 * 【主要テストケース】
 * - 各カテゴリの絵文字マッピング
 * - アルファベット変換（A-Z, AA...）
 * - エッジケース（存在しないカテゴリ）
 *
 * 【依存関係】
 * - @jest/globals: Jestテストフレームワーク
 * - ./generateAnonId: テスト対象の関数
 */

import { describe, it, expect } from '@jest/globals'
import { generateAnonId, getCategoryEmoji } from './generateAnonId'

/**
 * generateAnonId関数のテスト
 */
describe('generateAnonId', () => {
  /**
   * 正常系: カテゴリ絵文字マッピング
   */
  describe('カテゴリ絵文字マッピング', () => {
    /**
     * 飲みカテゴリ
     */
    it('飲みカテゴリの場合、🍶を使用', () => {
      // Arrange: 飲みカテゴリ、1件目の投稿
      const category = 'drinking'
      const dailyPostCount = 0

      // Act: 匿名ID生成
      const result = generateAnonId(category, dailyPostCount)

      // Assert: 🍶A
      expect(result).toBe('🍶A')
    })

    /**
     * 旅行カテゴリ
     */
    it('旅行カテゴリの場合、✈️を使用', () => {
      // Arrange: 旅行カテゴリ、1件目の投稿
      const category = 'travel'
      const dailyPostCount = 0

      // Act: 匿名ID生成
      const result = generateAnonId(category, dailyPostCount)

      // Assert: ✈️A
      expect(result).toBe('✈️A')
    })

    /**
     * テニスカテゴリ
     */
    it('テニスカテゴリの場合、🎾を使用', () => {
      // Arrange: テニスカテゴリ、1件目の投稿
      const category = 'tennis'
      const dailyPostCount = 0

      // Act: 匿名ID生成
      const result = generateAnonId(category, dailyPostCount)

      // Assert: 🎾A
      expect(result).toBe('🎾A')
    })

    /**
     * その他カテゴリ
     */
    it('その他カテゴリの場合、📌を使用', () => {
      // Arrange: その他カテゴリ、1件目の投稿
      const category = 'other'
      const dailyPostCount = 0

      // Act: 匿名ID生成
      const result = generateAnonId(category, dailyPostCount)

      // Assert: 📌A
      expect(result).toBe('📌A')
    })
  })

  /**
   * 正常系: アルファベット変換（1文字）
   */
  describe('アルファベット変換（1文字）', () => {
    /**
     * 1件目の投稿 → A
     */
    it('投稿数0の場合、Aを返す', () => {
      // Arrange: 投稿数0
      const result = generateAnonId('drinking', 0)

      // Assert: 🍶A
      expect(result).toBe('🍶A')
    })

    /**
     * 2件目の投稿 → B
     */
    it('投稿数1の場合、Bを返す', () => {
      // Arrange: 投稿数1
      const result = generateAnonId('drinking', 1)

      // Assert: 🍶B
      expect(result).toBe('🍶B')
    })

    /**
     * 3件目の投稿 → C
     */
    it('投稿数2の場合、Cを返す', () => {
      // Arrange: 投稿数2
      const result = generateAnonId('drinking', 2)

      // Assert: 🍶C
      expect(result).toBe('🍶C')
    })

    /**
     * 26件目の投稿 → Z
     */
    it('投稿数25の場合、Zを返す', () => {
      // Arrange: 投稿数25
      const result = generateAnonId('drinking', 25)

      // Assert: 🍶Z
      expect(result).toBe('🍶Z')
    })
  })

  /**
   * 正常系: アルファベット変換（複数文字）
   */
  describe('アルファベット変換（複数文字）', () => {
    /**
     * 27件目の投稿 → AA
     */
    it('投稿数26の場合、AAを返す', () => {
      // Arrange: 投稿数26
      const result = generateAnonId('drinking', 26)

      // Assert: 🍶AA
      expect(result).toBe('🍶AA')
    })

    /**
     * 28件目の投稿 → AB
     */
    it('投稿数27の場合、ABを返す', () => {
      // Arrange: 投稿数27
      const result = generateAnonId('drinking', 27)

      // Assert: 🍶AB
      expect(result).toBe('🍶AB')
    })

    /**
     * 52件目の投稿 → AZ
     */
    it('投稿数51の場合、AZを返す', () => {
      // Arrange: 投稿数51
      const result = generateAnonId('drinking', 51)

      // Assert: 🍶AZ
      expect(result).toBe('🍶AZ')
    })

    /**
     * 53件目の投稿 → BA
     */
    it('投稿数52の場合、BAを返す', () => {
      // Arrange: 投稿数52
      const result = generateAnonId('drinking', 52)

      // Assert: 🍶BA
      expect(result).toBe('🍶BA')
    })
  })

  /**
   * エッジケース: 存在しないカテゴリ
   */
  describe('エッジケース', () => {
    /**
     * 存在しないカテゴリの場合、otherの絵文字を使用
     */
    it('存在しないカテゴリの場合、📌を使用', () => {
      // Arrange: 存在しないカテゴリ
      const category = 'unknown_category'
      const dailyPostCount = 0

      // Act: 匿名ID生成
      const result = generateAnonId(category, dailyPostCount)

      // Assert: 📌A（otherカテゴリとして扱う）
      expect(result).toBe('📌A')
    })
  })
})

/**
 * getCategoryEmoji関数のテスト
 */
describe('getCategoryEmoji', () => {
  /**
   * 正常系: カテゴリ絵文字取得
   */
  it('各カテゴリの絵文字を正しく取得', () => {
    // Arrange & Act & Assert
    expect(getCategoryEmoji('drinking')).toBe('🍶')
    expect(getCategoryEmoji('travel')).toBe('✈️')
    expect(getCategoryEmoji('tennis')).toBe('🎾')
    expect(getCategoryEmoji('other')).toBe('📌')
  })

  /**
   * エッジケース: 存在しないカテゴリ
   */
  it('存在しないカテゴリの場合、📌を返す', () => {
    // Arrange: 存在しないカテゴリ
    const category = 'unknown_category'

    // Act: カテゴリ絵文字取得
    const result = getCategoryEmoji(category)

    // Assert: 📌（otherカテゴリとして扱う）
    expect(result).toBe('📌')
  })
})
