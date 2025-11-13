/**
 * ファイル名: generateAnonId.ts
 *
 * 【概要】
 * イベント投稿者の匿名ID生成ロジック
 * カテゴリ絵文字 + アルファベット（A-Z）の組み合わせで匿名性を確保
 *
 * 【処理フロー】
 * 1. カテゴリから対応する絵文字を取得
 * 2. その日のそのカテゴリの投稿数を取得
 * 3. 投稿数に応じたアルファベット（A, B, C...）を生成
 * 4. 絵文字 + アルファベットを結合して匿名IDを返す
 *
 * 【主要機能】
 * - カテゴリ絵文字マッピング
 * - 投稿数からアルファベット変換（0→A, 1→B, 25→Z, 26→AA...）
 * - 匿名ID生成（例: 🍶A, ✈️B）
 *
 * 【依存関係】
 * - spec.md FR-001: 匿名投稿機能
 * - spec.md FR-009: 匿名ID表示（🍶A形式）
 */

/**
 * カテゴリと絵文字のマッピング
 *
 * 【用途】カテゴリ値から対応する絵文字を取得
 * 【設計根拠】spec.md FR-003のカテゴリ定義
 */
const CATEGORY_EMOJI_MAP: Record<string, string> = {
  drinking: '🍶',
  travel: '✈️',
  tennis: '🎾',
  other: '📌',
} as const

/**
 * 投稿数をアルファベットに変換
 *
 * @param count - その日のそのカテゴリの投稿数（0始まり）
 * @returns アルファベット（A, B, C... Z, AA, AB...）
 *
 * 【処理内容】
 * 1. countを26進数として扱う（A=0, B=1... Z=25, AA=26...）
 * 2. 26で割った商と余りを使ってアルファベットを生成
 * 3. 再帰的に処理して複数文字に対応（AA, AB...）
 *
 * 【使用例】
 * countToAlphabet(0)  // => 'A'
 * countToAlphabet(1)  // => 'B'
 * countToAlphabet(25) // => 'Z'
 * countToAlphabet(26) // => 'AA'
 * countToAlphabet(27) // => 'AB'
 *
 * 【設計根拠】
 * 1日最大3投稿制限があるため、通常はA, B, Cのみ使用
 * ただし、制限解除時や特殊ケースに備えて無限拡張可能な実装
 */
function countToAlphabet(count: number): string {
  // 【ベースケース】26未満の場合は1文字のアルファベット
  if (count < 26) {
    // 文字コード計算: 65 = 'A'のASCIIコード
    return String.fromCharCode(65 + count)
  }

  // 【再帰ケース】26以上の場合は複数文字（AA, AB...）
  // 商（整数部分）を再帰的に処理
  const quotient = Math.floor(count / 26) - 1
  // 余り（0-25）を1文字アルファベットに変換
  const remainder = count % 26

  // 再帰呼び出し + 余りのアルファベット
  return countToAlphabet(quotient) + String.fromCharCode(65 + remainder)
}

/**
 * 匿名ID生成関数
 *
 * @param category - イベントカテゴリ（'drinking' | 'travel' | 'tennis' | 'other'）
 * @param dailyPostCount - その日のそのカテゴリの投稿数（0始まり）
 * @returns 匿名ID（例: '🍶A', '✈️B'）
 *
 * 【処理内容】
 * 1. カテゴリから絵文字を取得（CATEGORY_EMOJI_MAP）
 * 2. 投稿数をアルファベットに変換（countToAlphabet）
 * 3. 絵文字 + アルファベットを結合
 *
 * 【使用例】
 * // その日の飲みカテゴリ1件目の投稿
 * generateAnonId('drinking', 0) // => '🍶A'
 *
 * // その日の飲みカテゴリ2件目の投稿
 * generateAnonId('drinking', 1) // => '🍶B'
 *
 * // その日の旅行カテゴリ1件目の投稿
 * generateAnonId('travel', 0) // => '✈️A'
 *
 * 【エラーハンドリング】
 * - カテゴリが存在しない場合は '📌A' を返す（otherカテゴリとして扱う）
 *
 * 【設計根拠】
 * spec.md FR-009: 匿名ID表示（カテゴリ絵文字 + アルファベット）
 */
export function generateAnonId(category: string, dailyPostCount: number): string {
  // カテゴリから絵文字を取得（存在しない場合はotherの絵文字）
  const emoji = CATEGORY_EMOJI_MAP[category] ?? CATEGORY_EMOJI_MAP.other

  // 投稿数をアルファベットに変換
  const alphabet = countToAlphabet(dailyPostCount)

  // 絵文字 + アルファベットを結合して返す
  return `${emoji}${alphabet}`
}

/**
 * カテゴリ絵文字を取得
 *
 * @param category - イベントカテゴリ
 * @returns カテゴリ絵文字
 *
 * 【用途】
 * UI表示でカテゴリ絵文字のみが必要な場合に使用
 *
 * 【使用例】
 * getCategoryEmoji('drinking') // => '🍶'
 */
export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI_MAP[category] ?? CATEGORY_EMOJI_MAP.other
}
