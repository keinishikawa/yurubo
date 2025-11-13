/**
 * ファイル名: PostEventModal.tsx
 *
 * 【概要】
 * イベント投稿モーダルコンポーネント
 * カテゴリ選択、日時、人数、価格帯、コメント入力を提供
 *
 * 【処理フロー】
 * 1. React Hook Formでフォーム状態管理
 * 2. Zodスキーマでバリデーション
 * 3. 入力エラーを日本語で表示
 * 4. 送信時にonSubmitコールバックを呼び出し
 *
 * 【主要機能】
 * - カテゴリ選択（飲み・旅行・テニス・その他）
 * - 日時ピッカー（開始・終了）
 * - 想定人数入力（最小・最大）
 * - 価格帯スライダー（デフォルト3000-5000円）
 * - コメント入力
 * - バリデーションエラー表示
 *
 * 【依存関係】
 * - React Hook Form: フォーム管理
 * - Zod: バリデーション
 * - shadcn-ui: UIコンポーネント
 * - spec.md FR-002: 投稿フォーム要件
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createEventSchema, type CreateEventInput } from '@/lib/validation/event.schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

/**
 * PostEventModalのProps型
 */
type PostEventModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateEventInput) => Promise<void>
  isLoading?: boolean
}

/**
 * カテゴリ選択肢
 *
 * 【設計根拠】spec.md FR-003: カテゴリ定義
 */
const CATEGORY_OPTIONS = [
  { value: 'drinking', label: '🍶 飲み', emoji: '🍶' },
  { value: 'travel', label: '✈️ 旅行', emoji: '✈️' },
  { value: 'tennis', label: '🎾 テニス', emoji: '🎾' },
  { value: 'other', label: '📌 その他', emoji: '📌' },
] as const

/**
 * PostEventModalコンポーネント
 *
 * @param props - モーダル制御とsubmitハンドラーを含むProps
 * @returns イベント投稿モーダルUI
 *
 * 【処理内容】
 * 1. React Hook Formでフォーム状態管理
 * 2. Zodスキーマ（createEventSchema）でバリデーション
 * 3. 各入力フィールドの値変更をリアルタイム反映
 * 4. バリデーションエラーを日本語で表示
 * 5. 送信時にonSubmitコールバックを呼び出し
 *
 * 【使用例】
 * <PostEventModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleCreateEvent}
 *   isLoading={isCreating}
 * />
 *
 * 【設計根拠】
 * spec.md FR-001: イベント投稿モーダル表示
 * spec.md FR-002: 入力項目要件
 * spec.md FR-015: バリデーション要件
 */
export function PostEventModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: PostEventModalProps) {
  // 【ステップ1】React Hook Form初期化
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      category: 'drinking',
      date_start: '',
      date_end: '',
      capacity_min: 2,
      capacity_max: 6,
      price_min: 3000,
      price_max: 5000,
      comment: '',
      deadline: null,
    },
  })

  // 【ステップ2】価格帯スライダーの現在値を監視
  const priceMin = watch('price_min')
  const priceMax = watch('price_max')

  // 【ステップ3】フォーム送信ハンドラー
  const onFormSubmit = async (data: CreateEventInput) => {
    await onSubmit(data)
    reset() // 送信成功後にフォームをリセット
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>イベントを投稿</DialogTitle>
          <DialogDescription>
            つながりリスト内の該当カテゴリOKユーザーに配信されます（匿名投稿）
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* カテゴリ選択 (T049) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              カテゴリ <span className="text-destructive">*</span>
            </label>
            <Select
              onValueChange={(value) => setValue('category', value as any)}
              defaultValue="drinking"
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* タイトル */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              タイトル <span className="text-destructive">*</span>
            </label>
            <Input
              {...register('title')}
              placeholder="例: 軽く飲みませんか？"
              maxLength={50}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* 日時ピッカー (T050) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                開始日時 <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                {...register('date_start')}
              />
              {errors.date_start && (
                <p className="text-sm text-destructive">{errors.date_start.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                終了日時 <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                {...register('date_end')}
              />
              {errors.date_end && (
                <p className="text-sm text-destructive">{errors.date_end.message}</p>
              )}
            </div>
          </div>

          {/* 想定人数 (T051) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                最小人数 <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                {...register('capacity_min', { valueAsNumber: true })}
                min={1}
              />
              {errors.capacity_min && (
                <p className="text-sm text-destructive">{errors.capacity_min.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                最大人数 <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                {...register('capacity_max', { valueAsNumber: true })}
                min={1}
              />
              {errors.capacity_max && (
                <p className="text-sm text-destructive">{errors.capacity_max.message}</p>
              )}
            </div>
          </div>

          {/* 価格帯スライダー (T052) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              価格帯（任意） - {priceMin?.toLocaleString()}〜{priceMax?.toLocaleString()}円
            </label>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">最小予算</label>
                <Slider
                  min={0}
                  max={20000}
                  step={500}
                  value={[priceMin ?? 3000]}
                  onValueChange={(value) => setValue('price_min', value[0])}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">最大予算</label>
                <Slider
                  min={0}
                  max={20000}
                  step={500}
                  value={[priceMax ?? 5000]}
                  onValueChange={(value) => setValue('price_max', value[0])}
                />
              </div>
            </div>
            {errors.price_min && (
              <p className="text-sm text-destructive">{errors.price_min.message}</p>
            )}
            {errors.price_max && (
              <p className="text-sm text-destructive">{errors.price_max.message}</p>
            )}
          </div>

          {/* コメント (T053) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">コメント（任意）</label>
            <Textarea
              {...register('comment')}
              placeholder="例: 仕事終わりに軽く一杯どうですか？"
              rows={4}
              maxLength={500}
            />
            {errors.comment && (
              <p className="text-sm text-destructive">{errors.comment.message}</p>
            )}
          </div>

          {/* エラーメッセージ表示エリア (T055) */}
          {Object.keys(errors).length > 0 && (
            <div className="rounded-md bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">
                入力内容に誤りがあります。エラーメッセージを確認してください。
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '投稿中...' : '投稿する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
