/**
 * ファイル名: dateFormatter.ts
 *
 * 【概要】
 * 日時フォーマットユーティリティ
 * イベント日時・募集締切の日本語表示用フォーマット関数
 *
 * 【処理フロー】
 * 1. Date型またはISO 8601文字列を受け取る
 * 2. 日本標準時（JST）に変換
 * 3. 指定された形式にフォーマット
 *
 * 【主要機能】
 * - イベント日時フォーマット（例: 2025年1月15日（水）14:00）
 * - 日付のみフォーマット（例: 2025年1月15日（水））
 * - 時刻のみフォーマット（例: 14:00）
 * - 相対時間表示（例: 2時間後、明日）
 *
 * 【依存関係】
 * - Intl.DateTimeFormat: ブラウザ組み込みの国際化API
 */

/**
 * Date型またはISO 8601文字列をDate型に変換
 *
 * @param date - Date型またはISO 8601文字列
 * @returns Date型オブジェクト
 *
 * 【処理内容】
 * - 既にDate型の場合はそのまま返す
 * - 文字列の場合はnew Date()で変換
 *
 * 【使用例】
 * toDate(new Date()) // => Date型
 * toDate('2025-01-15T14:00:00Z') // => Date型
 */
function toDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date
}

/**
 * イベント日時フォーマット（日付 + 曜日 + 時刻）
 *
 * @param date - Date型またはISO 8601文字列
 * @returns フォーマット済み日時文字列（例: 2025年1月15日（水）14:00）
 *
 * 【処理内容】
 * 1. Date型に変換
 * 2. Intl.DateTimeFormatで日本語フォーマット
 * 3. 年月日、曜日、時刻を結合
 *
 * 【使用例】
 * formatEventDateTime('2025-01-15T14:00:00Z')
 * // => '2025年1月15日（水）14:00'
 *
 * formatEventDateTime(new Date(2025, 0, 15, 14, 0))
 * // => '2025年1月15日（水）14:00'
 */
export function formatEventDateTime(date: Date | string): string {
  const d = toDate(date)

  // 日付部分（年月日 + 曜日）
  const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Tokyo',
  })

  // 時刻部分（時:分）
  const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
    hour12: false, // 24時間表記
  })

  // 結合: "2025年1月15日（水）14:00"
  return `${dateFormatter.format(d)} ${timeFormatter.format(d)}`
}

/**
 * 日付のみフォーマット（年月日 + 曜日）
 *
 * @param date - Date型またはISO 8601文字列
 * @returns フォーマット済み日付文字列（例: 2025年1月15日（水））
 *
 * 【使用例】
 * formatDate('2025-01-15T14:00:00Z')
 * // => '2025年1月15日（水）'
 */
export function formatDate(date: Date | string): string {
  const d = toDate(date)

  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Tokyo',
  })

  return formatter.format(d)
}

/**
 * 時刻のみフォーマット（時:分）
 *
 * @param date - Date型またはISO 8601文字列
 * @returns フォーマット済み時刻文字列（例: 14:00）
 *
 * 【使用例】
 * formatTime('2025-01-15T14:00:00Z')
 * // => '14:00'
 */
export function formatTime(date: Date | string): string {
  const d = toDate(date)

  const formatter = new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
    hour12: false, // 24時間表記
  })

  return formatter.format(d)
}

/**
 * 相対時間表示（現在時刻からの差分）
 *
 * @param date - Date型またはISO 8601文字列
 * @returns 相対時間文字列（例: 2時間後、明日、1週間後）
 *
 * 【処理内容】
 * 1. 現在時刻との差分（ミリ秒）を計算
 * 2. 差分に応じて適切な単位で表示
 *    - 1時間未満: 「◯分後」「◯分前」
 *    - 1日未満: 「◯時間後」「◯時間前」
 *    - 1週間未満: 「明日」「昨日」「◯日後」「◯日前」
 *    - それ以上: 「◯週間後」「◯ヶ月後」「◯年後」
 *
 * 【使用例】
 * // 現在時刻が2025-01-15 12:00の場合
 * formatRelativeTime('2025-01-15T14:00:00Z') // => '2時間後'
 * formatRelativeTime('2025-01-16T12:00:00Z') // => '明日'
 * formatRelativeTime('2025-01-22T12:00:00Z') // => '1週間後'
 */
export function formatRelativeTime(date: Date | string): string {
  const d = toDate(date)
  const now = new Date()

  // 差分（ミリ秒）
  const diffMs = d.getTime() - now.getTime()
  // 差分（秒）
  const diffSec = Math.floor(diffMs / 1000)
  // 差分（分）
  const diffMin = Math.floor(diffSec / 60)
  // 差分（時間）
  const diffHour = Math.floor(diffMin / 60)
  // 差分（日）
  const diffDay = Math.floor(diffHour / 24)

  // 過去か未来か
  const isPast = diffMs < 0
  const suffix = isPast ? '前' : '後'

  // 絶対値で計算
  const absDiffMin = Math.abs(diffMin)
  const absDiffHour = Math.abs(diffHour)
  const absDiffDay = Math.abs(diffDay)

  // 1時間未満: 「◯分後」「◯分前」
  if (absDiffHour < 1) {
    return `${absDiffMin}分${suffix}`
  }

  // 1日未満: 「◯時間後」「◯時間前」
  if (absDiffDay < 1) {
    return `${absDiffHour}時間${suffix}`
  }

  // 1日後・前の場合は「明日」「昨日」
  if (absDiffDay === 1) {
    return isPast ? '昨日' : '明日'
  }

  // 1週間未満: 「◯日後」「◯日前」
  if (absDiffDay < 7) {
    return `${absDiffDay}日${suffix}`
  }

  // 1ヶ月未満: 「◯週間後」「◯週間前」
  if (absDiffDay < 30) {
    const weeks = Math.floor(absDiffDay / 7)
    return `${weeks}週間${suffix}`
  }

  // 1年未満: 「◯ヶ月後」「◯ヶ月前」
  if (absDiffDay < 365) {
    const months = Math.floor(absDiffDay / 30)
    return `${months}ヶ月${suffix}`
  }

  // 1年以上: 「◯年後」「◯年前」
  const years = Math.floor(absDiffDay / 365)
  return `${years}年${suffix}`
}

/**
 * 期間表示（開始〜終了）
 *
 * @param start - 開始日時（Date型またはISO 8601文字列）
 * @param end - 終了日時（Date型またはISO 8601文字列）
 * @returns 期間文字列（例: 1月15日（水）14:00 〜 16:00）
 *
 * 【処理内容】
 * 1. 開始日と終了日が同じ日かチェック
 * 2. 同じ日の場合: 日付（曜日）+ 開始時刻 〜 終了時刻
 * 3. 異なる日の場合: 開始日時 〜 終了日時
 *
 * 【使用例】
 * // 同じ日の場合
 * formatDateRange('2025-01-15T14:00:00Z', '2025-01-15T16:00:00Z')
 * // => '2025年1月15日（水）14:00 〜 16:00'
 *
 * // 異なる日の場合
 * formatDateRange('2025-01-15T14:00:00Z', '2025-01-16T16:00:00Z')
 * // => '2025年1月15日（水）14:00 〜 2025年1月16日（木）16:00'
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = toDate(start)
  const endDate = toDate(end)

  // 同じ日かチェック（年月日が一致）
  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()

  if (isSameDay) {
    // 同じ日の場合: "2025年1月15日（水）14:00 〜 16:00"
    return `${formatDate(startDate)} ${formatTime(startDate)} 〜 ${formatTime(endDate)}`
  }

  // 異なる日の場合: "2025年1月15日（水）14:00 〜 2025年1月16日（木）16:00"
  return `${formatEventDateTime(startDate)} 〜 ${formatEventDateTime(endDate)}`
}
