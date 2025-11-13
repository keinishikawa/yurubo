/**
 * ファイル名: event.schema.ts
 *
 * 【概要】
 * イベント作成・編集のバリデーションスキーマ（Zod）
 * フロントエンド・バックエンド両方で使用可能な型安全なバリデーション
 *
 * 【処理フロー】
 * 1. Zodでバリデーションルールを定義
 * 2. フォーム送信時・API受信時にスキーマでバリデーション
 * 3. バリデーションエラーを日本語メッセージで返す
 *
 * 【主要機能】
 * - イベント作成フォームのバリデーション
 * - イベント編集フォームのバリデーション
 * - 日本語エラーメッセージ
 * - TypeScript型推論（z.infer）
 *
 * 【依存関係】
 * - zod: バリデーションライブラリ
 * - spec.md NFR-002: バリデーション要件
 */

import { z } from 'zod'

/**
 * カテゴリ型
 *
 * 【用途】イベントカテゴリの列挙型
 * 【値】'drinking' | 'travel' | 'tennis' | 'other'
 *
 * 【設計根拠】spec.md FR-003
 *
 * 【注意】
 * z.enum()のデフォルトエラーメッセージは英語
 * フロントエンドでカスタムメッセージを使用することを推奨
 */
export const categorySchema = z.enum(['drinking', 'travel', 'tennis', 'other'])

/**
 * イベント作成フォームのバリデーションスキーマ
 *
 * 【用途】
 * - フロントエンド: react-hook-formと連携してフォームバリデーション
 * - バックエンド: API RouteでPOSTリクエストをバリデーション
 *
 * 【バリデーションルール】
 * - title: 1〜50文字（spec.md NFR-002-1）
 * - category: 'drinking' | 'travel' | 'tennis' | 'other'
 * - date_start: ISO 8601形式の日時文字列、現在時刻より未来
 * - date_end: ISO 8601形式の日時文字列、date_startより未来
 * - capacity_min: 1以上の整数
 * - capacity_max: capacity_min以上の整数
 * - price_min: 0以上の整数（オプション）
 * - price_max: price_min以上の整数（オプション）
 * - comment: 500文字以内（オプション）
 * - deadline: ISO 8601形式の日時文字列（オプション）
 *
 * 【使用例】
 * // フロントエンド（react-hook-form）
 * const form = useForm<CreateEventInput>({
 *   resolver: zodResolver(createEventSchema)
 * })
 *
 * // バックエンド（API Route）
 * const body = await request.json()
 * const result = createEventSchema.safeParse(body)
 * if (!result.success) {
 *   return Response.json({
 *     success: false,
 *     message: result.error.issues[0].message,
 *     code: 'VALIDATION_ERROR'
 *   })
 * }
 */
export const createEventSchema = z
  .object({
    // タイトル（必須、1〜50文字）
    title: z
      .string({ required_error: 'タイトルを入力してください' })
      .min(1, 'タイトルを入力してください')
      .max(50, 'タイトルは50文字以内で入力してください'),

    // カテゴリ（必須）
    category: categorySchema,

    // 開始日時（必須、未来の日時）
    // HTML5 datetime-local形式: YYYY-MM-DDTHH:MM
    date_start: z
      .string({ required_error: '開始日時を選択してください' })
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, '開始日時の形式が正しくありません')
      .refine(
        (date) => new Date(date) > new Date(),
        '開始日時は現在時刻より未来を選択してください'
      ),

    // 終了日時（必須、開始日時より未来）
    // HTML5 datetime-local形式: YYYY-MM-DDTHH:MM
    // ※date_startとの比較は.refine()で実施
    date_end: z
      .string({ required_error: '終了日時を選択してください' })
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, '終了日時の形式が正しくありません'),

    // 最小参加人数（必須、1以上）
    capacity_min: z
      .number({ required_error: '最小参加人数を入力してください' })
      .int('最小参加人数は整数で入力してください')
      .min(2, '最小参加人数は2人以上で入力してください'),

    // 最大参加人数（必須、最小参加人数以上）
    // ※capacity_minとの比較は.refine()で実施
    capacity_max: z
      .number({ required_error: '最大参加人数を入力してください' })
      .int('最大参加人数は整数で入力してください')
      .min(1, '最大参加人数は1人以上で入力してください'),

    // 最小予算（オプション、0以上）
    price_min: z
      .number()
      .int('最小予算は整数で入力してください')
      .min(0, '最小予算は0円以上で入力してください')
      .optional()
      .nullable(),

    // 最大予算（オプション、最小予算以上）
    // ※price_minとの比較は.refine()で実施
    price_max: z
      .number()
      .int('最大予算は整数で入力してください')
      .min(0, '最大予算は0円以上で入力してください')
      .optional()
      .nullable(),

    // 備考（オプション、500文字以内）
    comment: z
      .string()
      .max(500, '備考は500文字以内で入力してください')
      .optional()
      .nullable(),

    // 募集締切（オプション）
    deadline: z
      .string()
      .datetime({ message: '募集締切の形式が正しくありません' })
      .optional()
      .nullable(),
  })
  // クロスフィールドバリデーション
  .refine(
    // 終了日時 > 開始日時
    (data) => new Date(data.date_end) > new Date(data.date_start),
    {
      message: '終了日時は開始日時より未来を選択してください',
      path: ['date_end'], // エラーをdate_endフィールドに関連付け
    }
  )
  .refine(
    // 最大参加人数 >= 最小参加人数
    (data) => data.capacity_max >= data.capacity_min,
    {
      message: '最大参加人数は最小参加人数以上で入力してください',
      path: ['capacity_max'], // エラーをcapacity_maxフィールドに関連付け
    }
  )
  .refine(
    // 最大予算 >= 最小予算（両方が入力されている場合のみ）
    (data) => {
      // 両方nullの場合はOK
      if (data.price_min == null && data.price_max == null) return true
      // 片方のみnullの場合はOK
      if (data.price_min == null || data.price_max == null) return true
      // 両方入力されている場合は最大 >= 最小
      return data.price_max >= data.price_min
    },
    {
      message: '最大予算は最小予算以上で入力してください',
      path: ['price_max'], // エラーをprice_maxフィールドに関連付け
    }
  )
  .refine(
    // 募集締切 < 開催開始時刻（T071: Edge Case対応）
    (data) => {
      // deadlineが未設定の場合はバリデーションスキップ
      if (data.deadline == null) return true
      // 募集締切は開催開始時刻より前である必要がある
      return new Date(data.deadline) < new Date(data.date_start)
    },
    {
      message: '募集締切は開催開始時刻より前に設定してください',
      path: ['deadline'],
    }
  )

/**
 * イベント作成入力の型
 *
 * 【用途】
 * - react-hook-formのuseFormで使用
 * - フロントエンドのフォーム状態管理
 *
 * 【型推論】
 * Zodスキーマから自動的に型を推論（z.infer）
 * スキーマ変更時に型も自動更新される
 */
export type CreateEventInput = z.infer<typeof createEventSchema>

/**
 * イベント編集フォームのバリデーションスキーマ
 *
 * 【用途】
 * イベント編集時のバリデーション（募集中ステータスのみ編集可）
 *
 * 【設計根拠】
 * spec.md FR-013: 参加者承認前のみ編集可能
 *
 * 【特徴】
 * 作成スキーマと同じルールを使用（継承）
 */
export const updateEventSchema = createEventSchema

/**
 * イベント編集入力の型
 */
export type UpdateEventInput = z.infer<typeof updateEventSchema>
