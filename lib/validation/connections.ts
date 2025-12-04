/**
 * ファイル名: connections.ts
 *
 * 【概要】
 * つながりリクエスト・通知機能のバリデーションスキーマ（Zod）
 * ユーザー検索、リクエスト送信、リクエスト操作のバリデーション
 *
 * 【処理フロー】
 * 1. Zodでバリデーションルールを定義
 * 2. Server Action呼び出し時にスキーマでバリデーション
 * 3. バリデーションエラーを日本語メッセージで返す
 *
 * 【主要機能】
 * - ユーザー検索のバリデーション
 * - つながりリクエスト送信のバリデーション
 * - リクエスト承認・拒否のバリデーション
 * - 通知操作のバリデーション
 * - TypeScript型推論（z.infer）
 *
 * 【依存関係】
 * - zod: バリデーションライブラリ
 * - contracts/api.md: API契約定義
 *
 * 【関連ファイル】
 * - lib/validation/connection.schema.ts: 既存のつながり操作スキーマ
 */

import { z } from 'zod'

// ============================================================================
// ユーザー検索
// ============================================================================

/**
 * ユーザー検索のバリデーションスキーマ
 *
 * 【用途】
 * - app/actions/connections/search-users.ts のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - query: 1〜100文字の文字列（必須）
 * - limit: 1〜50の整数（オプション、デフォルト: 20）
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 */
export const searchUsersSchema = z.object({
  query: z
    .string({ message: '検索キーワードを入力してください' })
    .min(1, '検索キーワードを入力してください')
    .max(100, '検索キーワードは100文字以内で入力してください'),
  limit: z
    .number()
    .int('取得件数は整数で指定してください')
    .min(1, '取得件数は1以上で指定してください')
    .max(50, '取得件数は50以下で指定してください')
    .optional()
    .default(20),
})

/**
 * ユーザー検索入力の型
 */
export type SearchUsersInput = z.infer<typeof searchUsersSchema>

// ============================================================================
// つながりリクエスト送信
// ============================================================================

/**
 * つながりリクエスト送信のバリデーションスキーマ
 *
 * 【用途】
 * - app/actions/connections/send-request.ts のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - receiverId: UUID形式の文字列（必須）
 * - message: 200文字以内の文字列（オプション）
 *
 * @spec FR-002: つながりリクエストの送信機能
 * @spec US1-2: リクエスト送信後、相手に通知が届く
 */
export const sendRequestSchema = z.object({
  receiverId: z
    .string({ message: 'ユーザーIDを指定してください' })
    .uuid('ユーザーIDの形式が正しくありません'),
  message: z
    .string()
    .max(200, 'メッセージは200文字以内で入力してください')
    .optional(),
})

/**
 * つながりリクエスト送信入力の型
 */
export type SendRequestInput = z.infer<typeof sendRequestSchema>

// ============================================================================
// つながりリクエスト操作
// ============================================================================

/**
 * リクエストID指定のバリデーションスキーマ
 *
 * 【用途】
 * - app/actions/connections/accept-request.ts のリクエストバリデーション
 * - app/actions/connections/reject-request.ts のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - requestId: UUID形式の文字列（必須）
 *
 * @spec FR-003: つながりリクエストの承認/拒否機能
 */
export const requestIdSchema = z.object({
  requestId: z
    .string({ message: 'リクエストIDを指定してください' })
    .uuid('リクエストIDの形式が正しくありません'),
})

/**
 * リクエストID指定入力の型
 */
export type RequestIdInput = z.infer<typeof requestIdSchema>

// ============================================================================
// つながりリスト取得
// ============================================================================

/**
 * つながりリスト取得のバリデーションスキーマ
 *
 * 【用途】
 * - app/actions/connections/get-connections.ts のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - category: カテゴリ識別子（オプション）
 * - search: 名前検索クエリ（オプション、最大100文字）
 * - limit: 取得件数（オプション、デフォルト: 50）
 * - offset: オフセット（オプション、デフォルト: 0）
 *
 * @spec FR-005: つながりリストの一覧表示機能
 * @spec FR-010: カテゴリ別のフィルタ機能
 * @spec FR-011: 名前による検索機能
 */
export const getConnectionsSchema = z.object({
  category: z.string().optional(),
  search: z
    .string()
    .max(100, '検索キーワードは100文字以内で入力してください')
    .optional(),
  limit: z
    .number()
    .int('取得件数は整数で指定してください')
    .min(1, '取得件数は1以上で指定してください')
    .max(100, '取得件数は100以下で指定してください')
    .optional()
    .default(50),
  offset: z
    .number()
    .int('オフセットは整数で指定してください')
    .min(0, 'オフセットは0以上で指定してください')
    .optional()
    .default(0),
})

/**
 * つながりリスト取得入力の型
 */
export type GetConnectionsInput = z.infer<typeof getConnectionsSchema>

// ============================================================================
// カテゴリ設定更新
// ============================================================================

/**
 * カテゴリ設定更新のバリデーションスキーマ
 *
 * 【用途】
 * - app/actions/connections/update-categories.ts のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - targetId: UUID形式の文字列（必須）
 * - categoryFlags: カテゴリ別ON/OFFフラグ（必須）
 *
 * 【注意】
 * categoryFlagsは動的キーを許容（ユーザーのenabled_categoriesに依存）
 *
 * @spec FR-006: つながりごとのカテゴリ設定機能
 * @spec FR-007: カテゴリ設定は双方向で管理
 */
export const updateCategoriesSchema = z.object({
  targetId: z
    .string({ message: 'ユーザーIDを指定してください' })
    .uuid('ユーザーIDの形式が正しくありません'),
  categoryFlags: z.record(z.string(), z.boolean(), {
    message: 'カテゴリフラグの形式が正しくありません',
  }),
})

/**
 * カテゴリ設定更新入力の型
 */
export type UpdateCategoriesInput = z.infer<typeof updateCategoriesSchema>

// ============================================================================
// 通知操作
// ============================================================================

/**
 * 通知一覧取得のバリデーションスキーマ
 *
 * 【用途】
 * - app/actions/notifications/get-notifications.ts のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - unread_only: 未読のみ取得（オプション、デフォルト: false）
 * - limit: 取得件数（オプション、デフォルト: 20）
 * - offset: オフセット（オプション、デフォルト: 0）
 */
export const getNotificationsSchema = z.object({
  unread_only: z.boolean().optional().default(false),
  limit: z
    .number()
    .int('取得件数は整数で指定してください')
    .min(1, '取得件数は1以上で指定してください')
    .max(100, '取得件数は100以下で指定してください')
    .optional()
    .default(20),
  offset: z
    .number()
    .int('オフセットは整数で指定してください')
    .min(0, 'オフセットは0以上で指定してください')
    .optional()
    .default(0),
})

/**
 * 通知一覧取得入力の型
 */
export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>

/**
 * 通知ID指定のバリデーションスキーマ
 *
 * 【用途】
 * - app/actions/notifications/mark-as-read.ts のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - notificationId: UUID形式の文字列（必須）
 */
export const notificationIdSchema = z.object({
  notificationId: z
    .string({ message: '通知IDを指定してください' })
    .uuid('通知IDの形式が正しくありません'),
})

/**
 * 通知ID指定入力の型
 */
export type NotificationIdInput = z.infer<typeof notificationIdSchema>
