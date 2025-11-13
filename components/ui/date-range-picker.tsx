/**
 * ファイル名: date-range-picker.tsx
 *
 * 【概要】
 * 開始日時〜終了日時を1つのコンポーネントで統合表示する日時範囲選択コンポーネント
 * イベントの開催期間を直感的に入力可能
 *
 * 【処理フロー】
 * 1. DateRange型 { start: string, end: string } を受け取る
 * 2. 2つのdatetime-local入力を横並びで配置
 * 3. 視覚的に1つの範囲選択コンポーネントとして表現
 * 4. 値変更時にonChangeコールバックを呼び出し
 *
 * 【主要機能】
 * - 開始・終了日時の統合表示
 * - 横並びレイアウトで範囲感を表現
 * - React Hook Formとの統合対応
 * - バリデーションエラー表示
 *
 * 【依存関係】
 * - React Hook Form: フォーム統合
 * - event.schema.ts: バリデーションルール
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * DateRange型定義
 */
export type DateRange = {
  /** 開始日時（ISO 8601形式: YYYY-MM-DDTHH:MM） */
  start: string
  /** 終了日時（ISO 8601形式: YYYY-MM-DDTHH:MM） */
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
 * DateRangePickerコンポーネント
 *
 * @param props - DateRangePickerのProps
 * @returns 開始〜終了を統合表示する日時範囲選択コンポーネント
 *
 * 【処理内容】
 * 1. valueを { start, end } オブジェクトとして受け取る
 * 2. 2つのdatetime-local入力を横並びで配置
 * 3. 開始日時変更時にonChange({ ...value, start: newValue })を呼び出し
 * 4. 終了日時変更時にonChange({ ...value, end: newValue })を呼び出し
 * 5. エラーメッセージを各フィールドの下に表示
 *
 * 【UI仕様】
 * - レイアウト: 横並び（grid-cols-2）
 * - 枠線: 統合感を出すためのborder
 * - ラベル: 「開始日時」「終了日時」
 *
 * 【使用例】
 * <DateRangePicker
 *   value={{ start: '2025-11-13T19:00', end: '2025-11-13T22:00' }}
 *   onChange={(range) => {
 *     setValue('date_start', range.start);
 *     setValue('date_end', range.end);
 *   }}
 *   startError={errors.date_start?.message}
 *   endError={errors.date_end?.message}
 * />
 *
 * 【設計根拠】
 * - UI改善リクエスト: 開始・終了を1つのコンポーネントで表現
 * - UX: 範囲選択の視覚的な統合感を演出
 *
 * 【アクセシビリティ】
 * - ラベル: 各入力にLabel要素を関連付け
 * - エラーメッセージ: text-destructive色で明示
 * - フォーカス管理: Tab/Shift+Tabで移動
 */
export function DateRangePicker({
  value,
  onChange,
  startError,
  endError,
  disabled = false,
  className,
}: DateRangePickerProps) {
  // 【ステップ1】開始日時変更ハンドラー
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      start: e.target.value,
    })
  }

  // 【ステップ2】終了日時変更ハンドラー
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      end: e.target.value,
    })
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 開始日時 */}
          <div className="space-y-2">
            <Label htmlFor="date_start" className="text-sm font-medium">
              開始日時<span className="text-destructive">*</span>
            </Label>
            <Input
              id="date_start"
              type="datetime-local"
              value={value.start}
              onChange={handleStartChange}
              disabled={disabled}
              className={cn(
                'w-full',
                startError && 'border-destructive focus-visible:ring-destructive'
              )}
              aria-invalid={!!startError}
              aria-describedby={startError ? 'date_start-error' : undefined}
            />
            {startError && (
              <p
                id="date_start-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {startError}
              </p>
            )}
          </div>

          {/* 終了日時 */}
          <div className="space-y-2">
            <Label htmlFor="date_end" className="text-sm font-medium">
              終了日時<span className="text-destructive">*</span>
            </Label>
            <Input
              id="date_end"
              type="datetime-local"
              value={value.end}
              onChange={handleEndChange}
              disabled={disabled}
              className={cn(
                'w-full',
                endError && 'border-destructive focus-visible:ring-destructive'
              )}
              aria-invalid={!!endError}
              aria-describedby={endError ? 'date_end-error' : undefined}
            />
            {endError && (
              <p
                id="date_end-error"
                className="text-sm text-destructive"
                role="alert"
              >
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
