/**
 * ファイル名: user.schema.ts
 *
 * 【概要】
 * ユーザープロフィール操作のバリデーションスキーマ（Zod）
 * プロフィール作成・更新のバリデーション
 *
 * 【処理フロー】
 * 1. Zodでバリデーションルールを定義
 * 2. プロフィール作成・更新時にスキーマでバリデーション
 * 3. バリデーションエラーを日本語メッセージで返す
 *
 * 【主要機能】
 * - プロフィール作成のバリデーション
 * - プロフィール更新のバリデーション
 * - 通知設定のバリデーション
 * - TypeScript型推論（z.infer）
 *
 * 【依存関係】
 * - zod: バリデーションライブラリ
 * - spec.md FR-018: ユーザープロフィール管理
 */

import { z } from 'zod'
import { categorySchema } from './event.schema'

/**
 * 通知設定スキーマ
 *
 * 【用途】
 * usersテーブルのnotification_preferences（JSONB）のバリデーション
 *
 * 【型定義】
 * {
 *   event_invitation: boolean,      // イベント招待通知
 *   event_update: boolean,           // イベント更新通知
 *   event_cancellation: boolean,     // イベント中止通知
 *   participant_confirmed: boolean   // 参加者確定通知
 * }
 *
 * 【設計根拠】
 * spec.md FR-018: 通知設定管理
 */
export const notificationPreferencesSchema = z.object({
  event_invitation: z.boolean(),
  event_update: z.boolean(),
  event_cancellation: z.boolean(),
  participant_confirmed: z.boolean(),
})

/**
 * プロフィール作成のバリデーションスキーマ
 *
 * 【用途】
 * - Supabase Auth登録後のプロフィール作成時にバリデーション
 * - POST /api/users のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - display_name: 1〜50文字（必須）
 * - avatar_url: URL形式の文字列（オプション）
 * - bio: 500文字以内（オプション）
 * - enabled_categories: カテゴリ配列（オプション、デフォルト全カテゴリ有効）
 * - notification_preferences: 通知設定オブジェクト（オプション、デフォルト全てtrue）
 *
 * 【使用例】
 * // プロフィール作成時
 * const result = createUserProfileSchema.safeParse({
 *   display_name: 'テストユーザー',
 *   avatar_url: 'https://example.com/avatar.jpg',
 *   bio: 'よろしくお願いします',
 *   enabled_categories: ['drinking', 'travel']
 * })
 *
 * 【注意】
 * id（ユーザーID）はauth.uid()から取得するため、
 * バリデーションスキーマには含めない
 */
export const createUserProfileSchema = z.object({
  // 表示名（必須、1〜50文字）
  display_name: z
    .string({ required_error: '表示名を入力してください' })
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください'),

  // プロフィール画像URL（オプション、URL形式）
  avatar_url: z
    .string()
    .url({ message: 'プロフィール画像のURLが正しくありません' })
    .optional()
    .nullable(),

  // 自己紹介（オプション、500文字以内）
  bio: z
    .string()
    .max(500, '自己紹介は500文字以内で入力してください')
    .optional()
    .nullable(),

  // 有効カテゴリ（オプション、デフォルト全カテゴリ有効）
  enabled_categories: z
    .array(categorySchema)
    .optional()
    .default(['drinking', 'travel', 'tennis', 'other']),

  // 通知設定（オプション、デフォルト全てtrue）
  notification_preferences: notificationPreferencesSchema.optional().default({
    event_invitation: true,
    event_update: true,
    event_cancellation: true,
    participant_confirmed: true,
  }),
})

/**
 * プロフィール作成入力の型
 */
export type CreateUserProfileInput = z.infer<typeof createUserProfileSchema>

/**
 * プロフィール更新のバリデーションスキーマ
 *
 * 【用途】
 * - フロントエンド: プロフィール編集フォームのバリデーション
 * - バックエンド: PATCH /api/users のリクエストバリデーション
 *
 * 【バリデーションルール】
 * すべてのフィールドがオプション（部分更新可能）
 *
 * 【使用例】
 * // 表示名のみ更新
 * const result = updateUserProfileSchema.safeParse({
 *   display_name: '新しい表示名'
 * })
 *
 * // 通知設定のみ更新
 * const result = updateUserProfileSchema.safeParse({
 *   notification_preferences: {
 *     event_invitation: false,
 *     event_update: true,
 *     event_cancellation: true,
 *     participant_confirmed: true
 *   }
 * })
 */
export const updateUserProfileSchema = z.object({
  // 表示名（オプション、1〜50文字）
  display_name: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください')
    .optional(),

  // プロフィール画像URL（オプション、URL形式）
  avatar_url: z
    .string()
    .url({ message: 'プロフィール画像のURLが正しくありません' })
    .optional()
    .nullable(),

  // 自己紹介（オプション、500文字以内）
  bio: z
    .string()
    .max(500, '自己紹介は500文字以内で入力してください')
    .optional()
    .nullable(),

  // 有効カテゴリ（オプション）
  enabled_categories: z.array(categorySchema).optional(),

  // 通知設定（オプション）
  notification_preferences: notificationPreferencesSchema.optional(),
})

/**
 * プロフィール更新入力の型
 */
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>
