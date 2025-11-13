/**
 * ファイル名: date-range-picker.tsx
 *
 * 【概要】
 * カレンダー + 30分間隔の時刻選択で日時範囲を選択するコンポーネント
 * 添付画像のようなUI/UXを実現
 *
 * 【処理フロー】
 * 1. 開始日をカレンダーで選択
 * 2. 開始時刻を30分間隔のセレクトで選択
 * 3. 終了日をカレンダーで選択
 * 4. 終了時刻を30分間隔のセレクトで選択
 * 5. YYYY-MM-DDTHH:MM形式で親コンポーネントに返す
 *
 * 【主要機能】
 * - shadcn-ui Calendarによる日付選択
 * - 30分間隔の時刻セレクト（00:00〜23:30）
 * - 同一モーダル内で開始・終了を選択
 * - HTML5 datetime-local形式（YYYY-MM-DDTHH:MM）出力
 *
 * 【依存関係】
 * - shadcn-ui Calendar: 日付選択
 * - React Hook Form: フォーム統合
 */

'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ja } from 'date-fns/locale'

/**
 * DateRange型定義
 */
export type DateRange = {
  /** 開始日時（HTML5 datetime-local形式: YYYY-MM-DDTHH:MM） */
  start: string
  /** 終了日時（HTML5 datetime-local形式: YYYY-MM-DDTHH:MM） */
  end: string
}

/**
 * DateRangePickerのProps型定義
 */
type DateRangePickerProps = {
  /** 範囲の値 { start, end } */
  value: DateRange
  /** 値変更時のコールバック */
  onChange: (value: DateRange) => void
  /** 開始日時のエラーメッセージ */
  startError?: string
  /** 終了日時のエラーメッセージ */
  endError?: string
  /** 無効化フラグ */
  disabled?: boolean
  /** 追加のCSSクラス */
  className?: string
}

/**
 * 30分間隔の時刻オプションを生成
 *
 * @returns ['00:00', '00:30', '01:00', ..., '23:30']
 */
function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      times.push(`${h}:${m}`)
    }
  }
  return times
}

/**
 * 現在時刻の2時間後の時刻を取得（30分単位に切り上げ）
 *
 * @returns HH:MM形式の時刻
 */
function getDefaultStartTime(): string {
  const now = new Date()
  now.setHours(now.getHours() + 2) // 2時間後

  const hour = now.getHours()
  const minute = now.getMinutes()

  // 30分単位に切り上げ
  const roundedMinute = minute <= 0 ? 0 : minute <= 30 ? 30 : 0
  const roundedHour = roundedMinute === 0 && minute > 30 ? (hour + 1) % 24 : hour

  return `${roundedHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`
}

/**
 * datetime-local形式の文字列から日付と時刻を分離
 *
 * @param datetime - YYYY-MM-DDTHH:MM
 * @returns { date: Date | undefined, time: string }
 */
function parseDateTimeLocal(datetime: string): { date: Date | undefined; time: string } {
  if (!datetime) {
    return { date: undefined, time: getDefaultStartTime() }
  }
  const [datePart, timePart] = datetime.split('T')
  const date = datePart ? new Date(datePart) : undefined
  return { date, time: timePart || getDefaultStartTime() }
}

/**
 * 日付と時刻をdatetime-local形式に結合
 *
 * @param date - Date object
 * @param time - HH:MM
 * @returns YYYY-MM-DDTHH:MM
 */
function formatDateTimeLocal(date: Date | undefined, time: string): string {
  if (!date) return ''
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}T${time}`
}

/**
 * 時刻に指定時間を加算
 *
 * @param time - HH:MM
 * @param hours - 加算する時間数
 * @returns { time: HH:MM, nextDay: boolean } 翌日にまたがる場合はnextDay=true
 */
function addHoursToTime(time: string, hours: number): { time: string; nextDay: boolean } {
  const [h, m] = time.split(':').map(Number)
  let newHour = h + hours
  let nextDay = false

  if (newHour >= 24) {
    newHour = newHour % 24
    nextDay = true
  }

  const newTime = `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  return { time: newTime, nextDay }
}

/**
 * DateRangePickerコンポーネント
 *
 * @param props - DateRangePickerのProps
 * @returns カレンダー + 時刻選択の日時範囲ピッカー
 *
 * 【処理内容】
 * 1. valueから開始日・時刻、終了日・時刻を分離
 * 2. Calendarで日付を選択
 * 3. Selectで時刻を選択（30分間隔）
 * 4. 変更時にonChangeでdatetime-local形式で返す
 *
 * 【UI仕様】
 * - 横並び（開始 | 終了）
 * - カレンダー: shadcn-ui Calendar
 * - 時刻: 30分間隔のセレクト
 *
 * 【設計根拠】
 * - ユーザー要望: 添付画像のようなUI
 * - 30分間隔での時刻指定
 * - 同一モーダル内で開始・終了を選択
 */
export function DateRangePicker({
  value,
  onChange,
  startError,
  endError,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const timeOptions = generateTimeOptions()

  // 【ステップ1】開始日時を分離
  const { date: startDate, time: startTime } = parseDateTimeLocal(value.start)

  // 【ステップ2】終了日時を分離
  const { date: endDate, time: endTime } = parseDateTimeLocal(value.end)

  // 【ステップ3】初回設定フラグ（終了時刻が未設定 or デフォルト値の場合）
  const isEndTimeInitial = !value.end || value.end === ''

  // 【ステップ4】開始日変更ハンドラー
  const handleStartDateChange = (date: Date | undefined) => {
    const newStart = formatDateTimeLocal(date, startTime)

    // 初回のみ終了日時を自動設定（+4時間）
    if (isEndTimeInitial && date) {
      const autoEndDate = new Date(date)
      const autoEndTime = addHoursToTime(startTime, 4)
      // 時刻が翌日にまたがる場合は日付を+1
      if (autoEndTime.nextDay) {
        autoEndDate.setDate(autoEndDate.getDate() + 1)
      }
      const newEnd = formatDateTimeLocal(autoEndDate, autoEndTime.time)
      onChange({ start: newStart, end: newEnd })
    } else {
      onChange({ ...value, start: newStart })
    }
  }

  // 【ステップ5】開始時刻変更ハンドラー
  const handleStartTimeChange = (time: string) => {
    const newStart = formatDateTimeLocal(startDate, time)

    // 初回のみ終了時刻を自動設定（+4時間）
    if (isEndTimeInitial && startDate) {
      const autoEndDate = new Date(startDate)
      const autoEndTime = addHoursToTime(time, 4)
      // 時刻が翌日にまたがる場合は日付を+1
      if (autoEndTime.nextDay) {
        autoEndDate.setDate(autoEndDate.getDate() + 1)
      }
      const newEnd = formatDateTimeLocal(autoEndDate, autoEndTime.time)
      onChange({ start: newStart, end: newEnd })
    } else {
      onChange({ ...value, start: newStart })
    }
  }

  // 【ステップ6】終了日変更ハンドラー
  const handleEndDateChange = (date: Date | undefined) => {
    const newEnd = formatDateTimeLocal(date, endTime)
    onChange({ ...value, end: newEnd })
  }

  // 【ステップ7】終了時刻変更ハンドラー
  const handleEndTimeChange = (time: string) => {
    const newEnd = formatDateTimeLocal(endDate, time)
    onChange({ ...value, end: newEnd })
  }

  return (
    <div className={cn('w-full', className)}>
      {/* タイトル */}
      <div className="mb-2 text-sm font-medium text-foreground">
        開催日時
      </div>

      {/* 統合枠線 */}
      <div className="rounded-lg border border-input bg-background p-4">
        {/* 横並びレイアウト */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 開始日時 */}
          <div className="space-y-3">
            <div className="text-sm font-medium">
              開始<span className="text-destructive">*</span>
            </div>

            {/* カレンダー */}
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateChange}
              disabled={(date) => {
                // 過去の日付を無効化
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today || disabled
              }}
              locale={ja}
              className="rounded-md border"
            />

            {/* 時刻セレクト */}
            <Select value={startTime} onValueChange={handleStartTimeChange} disabled={disabled}>
              <SelectTrigger className={cn(startError && 'border-destructive')}>
                <SelectValue placeholder="時刻を選択" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* エラーメッセージ */}
            {startError && (
              <p className="text-sm text-destructive" role="alert">
                {startError}
              </p>
            )}
          </div>

          {/* 終了日時 */}
          <div className="space-y-3">
            <div className="text-sm font-medium">
              終了<span className="text-destructive">*</span>
            </div>

            {/* カレンダー */}
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateChange}
              disabled={(date) => {
                // 過去の日付を無効化
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today || disabled
              }}
              locale={ja}
              className="rounded-md border"
            />

            {/* 時刻セレクト */}
            <Select value={endTime} onValueChange={handleEndTimeChange} disabled={disabled}>
              <SelectTrigger className={cn(endError && 'border-destructive')}>
                <SelectValue placeholder="時刻を選択" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* エラーメッセージ */}
            {endError && (
              <p className="text-sm text-destructive" role="alert">
                {endError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 全体のヒントメッセージ */}
      <p className="mt-2 text-xs text-muted-foreground">
        終了日時は開始日時より後に設定してください
      </p>
    </div>
  )
}
