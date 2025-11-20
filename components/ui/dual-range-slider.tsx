/**
 * ファイル名: dual-range-slider.tsx
 *
 * 【概要】
 * 2つのハンドルで範囲選択可能なスライダーコンポーネント
 * 価格帯や人数の最小〜最大を1つのスライダーで選択可能
 *
 * 【処理フロー】
 * 1. 配列形式の値 [min, max] を受け取る
 * 2. Radix UIのSliderで2つのハンドルを表示
 * 3. ラベル関数で値をフォーマットして表示（例: 3,000〜5,000円）
 * 4. 値変更時にonValueChangeコールバックを呼び出し
 *
 * 【主要機能】
 * - 範囲選択（2つのハンドル）
 * - カスタマイズ可能なラベル表示
 * - React Hook Formとの統合対応
 * - アクセシビリティ対応（Radix UI標準）
 *
 * 【依存関係】
 * - @radix-ui/react-slider: スライダー基盤
 * - React Hook Form: フォーム統合
 */

'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

/**
 * DualRangeSliderのProps型定義
 */
type DualRangeSliderProps = {
  /** 範囲の値 [min, max] */
  value: [number, number]
  /** 値変更時のコールバック */
  onValueChange: (value: [number, number]) => void
  /** スライダーの最小値 */
  min?: number
  /** スライダーの最大値 */
  max?: number
  /** ステップ幅 */
  step?: number
  /** ラベルフォーマット関数（例: values => `${values[0]}〜${values[1]}円`） */
  label?: (values: [number, number]) => string
  /** 無効化フラグ */
  disabled?: boolean
  /** 追加のCSSクラス */
  className?: string
  /** ラベル位置 */
  labelPosition?: 'top' | 'bottom'
}

/**
 * DualRangeSliderコンポーネント
 *
 * @param props - DualRangeSliderのProps
 * @returns 2つのハンドルで範囲選択可能なスライダー
 *
 * 【処理内容】
 * 1. valueを [min, max] 配列として受け取る
 * 2. Radix UIのSliderPrimitiveで2つのハンドルを表示
 * 3. label関数で値をフォーマットして表示（スライダーの上または下）
 * 4. onValueChangeで親コンポーネントに値を返す
 *
 * 【UI仕様】
 * - ハンドル: 2つ（最小値用・最大値用）
 * - トラック: 選択範囲を色付きで表示
 * - ラベル: デフォルトでスライダーの上に表示
 *
 * 【使用例】
 * <DualRangeSlider
 *   value={[3000, 5000]}
 *   onValueChange={(values) => { setValue('price_min', values[0]); setValue('price_max', values[1]); }}
 *   min={0}
 *   max={20000}
 *   step={500}
 *   label={(values) => `${values[0].toLocaleString()}〜${values[1].toLocaleString()}円`}
 * />
 *
 * 【設計根拠】
 * - UI改善リクエスト: 価格帯・人数を1つのスライダーで表現
 * - アクセシビリティ: Radix UIの標準機能でキーボード操作対応
 *
 * 【アクセシビリティ】
 * - キーボード操作: 矢印キー、Home/End
 * - ARIA属性: aria-valuemin, aria-valuemax, aria-valuenow
 * - フォーカス管理: Tab/Shift+Tabで移動
 */
export function DualRangeSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  disabled = false,
  className,
  labelPosition = 'top',
}: DualRangeSliderProps) {
  // 【ステップ1】値の変更ハンドラー
  const handleValueChange = (newValue: number[]) => {
    // Radix UIは配列を返すが、型を[number, number]に変換
    if (newValue.length === 2) {
      onValueChange([newValue[0], newValue[1]])
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {/* ラベル表示（上） */}
      {label && labelPosition === 'top' && (
        <div className="mb-2 text-sm font-medium text-foreground">
          {label(value)}
        </div>
      )}

      {/* スライダー本体 */}
      <SliderPrimitive.Root
        value={value}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          'relative flex w-full touch-none items-center select-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* トラック（背景） */}
        <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full">
          {/* 選択範囲（色付き部分） */}
          <SliderPrimitive.Range className="bg-primary absolute h-full" />
        </SliderPrimitive.Track>

        {/* ハンドル1（最小値） */}
        <SliderPrimitive.Thumb
          className={cn(
            'block size-4 shrink-0 rounded-full border-2 border-primary bg-white shadow-sm',
            'ring-ring/50 transition-[color,box-shadow]',
            'hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
          aria-label="最小値"
        />

        {/* ハンドル2（最大値） */}
        <SliderPrimitive.Thumb
          className={cn(
            'block size-4 shrink-0 rounded-full border-2 border-primary bg-white shadow-sm',
            'ring-ring/50 transition-[color,box-shadow]',
            'hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
          aria-label="最大値"
        />
      </SliderPrimitive.Root>

      {/* ラベル表示（下） */}
      {label && labelPosition === 'bottom' && (
        <div className="mt-2 text-sm font-medium text-foreground">
          {label(value)}
        </div>
      )}
    </div>
  )
}
