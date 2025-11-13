/**
 * ファイル名: connection.schema.ts
 *
 * 【概要】
 * つながりリスト操作のバリデーションスキーマ（Zod）
 * つながり追加・カテゴリフラグ更新のバリデーション
 *
 * 【処理フロー】
 * 1. Zodでバリデーションルールを定義
 * 2. つながり追加・更新時にスキーマでバリデーション
 * 3. バリデーションエラーを日本語メッセージで返す
 *
 * 【主要機能】
 * - つながり追加のバリデーション
 * - カテゴリフラグ更新のバリデーション
 * - TypeScript型推論（z.infer）
 *
 * 【依存関係】
 * - zod: バリデーションライブラリ
 * - spec.md FR-007: つながりリスト管理
 */

import { z } from 'zod'

/**
 * カテゴリフラグスキーマ
 *
 * 【用途】
 * connectionsテーブルのcategory_flags（JSONB）のバリデーション
 *
 * 【型定義】
 * {
 *   drinking: boolean,
 *   travel: boolean,
 *   tennis: boolean,
 *   other: boolean
 * }
 *
 * 【設計根拠】
 * spec.md FR-008: カテゴリ単位のON/OFF制御
 */
export const categoryFlagsSchema = z.object({
  drinking: z.boolean(),
  travel: z.boolean(),
  tennis: z.boolean(),
  other: z.boolean(),
})

/**
 * つながり追加のバリデーションスキーマ
 *
 * 【用途】
 * - フロントエンド: つながり追加フォームのバリデーション
 * - バックエンド: POST /api/connections のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - target_id: UUID形式の文字列（必須）
 * - category_flags: カテゴリフラグオブジェクト（オプション、デフォルト全てfalse）
 *
 * 【使用例】
 * // つながり追加時
 * const result = addConnectionSchema.safeParse({
 *   target_id: 'user-uuid-here',
 *   category_flags: {
 *     drinking: true,
 *     travel: false,
 *     tennis: false,
 *     other: false
 *   }
 * })
 *
 * 【注意】
 * user_id（追加するユーザー）はauth.uid()から取得するため、
 * バリデーションスキーマには含めない
 */
export const addConnectionSchema = z.object({
  // 追加対象ユーザーのID（UUID形式）
  target_id: z
    .string({ required_error: 'ユーザーIDを指定してください' })
    .uuid({ message: 'ユーザーIDの形式が正しくありません' }),

  // カテゴリフラグ（オプション、デフォルト全てfalse）
  category_flags: categoryFlagsSchema.optional().default({
    drinking: false,
    travel: false,
    tennis: false,
    other: false,
  }),
})

/**
 * つながり追加入力の型
 */
export type AddConnectionInput = z.infer<typeof addConnectionSchema>

/**
 * カテゴリフラグ更新のバリデーションスキーマ
 *
 * 【用途】
 * - フロントエンド: つながりリスト画面でカテゴリフラグを変更する際のバリデーション
 * - バックエンド: PATCH /api/connections のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - target_id: UUID形式の文字列（必須）
 * - category_flags: カテゴリフラグオブジェクト（必須）
 *
 * 【使用例】
 * // カテゴリフラグ更新時
 * const result = updateCategoryFlagsSchema.safeParse({
 *   target_id: 'user-uuid-here',
 *   category_flags: {
 *     drinking: true,  // 飲みカテゴリをONに変更
 *     travel: true,
 *     tennis: false,
 *     other: false
 *   }
 * })
 */
export const updateCategoryFlagsSchema = z.object({
  // 更新対象ユーザーのID（UUID形式）
  target_id: z
    .string({ required_error: 'ユーザーIDを指定してください' })
    .uuid({ message: 'ユーザーIDの形式が正しくありません' }),

  // カテゴリフラグ（必須）
  category_flags: categoryFlagsSchema,
})

/**
 * カテゴリフラグ更新入力の型
 */
export type UpdateCategoryFlagsInput = z.infer<typeof updateCategoryFlagsSchema>

/**
 * つながり削除のバリデーションスキーマ
 *
 * 【用途】
 * - バックエンド: DELETE /api/connections のリクエストバリデーション
 *
 * 【バリデーションルール】
 * - target_id: UUID形式の文字列（必須）
 *
 * 【使用例】
 * // つながり削除時
 * const result = deleteConnectionSchema.safeParse({
 *   target_id: 'user-uuid-here'
 * })
 */
export const deleteConnectionSchema = z.object({
  // 削除対象ユーザーのID（UUID形式）
  target_id: z
    .string({ required_error: 'ユーザーIDを指定してください' })
    .uuid({ message: 'ユーザーIDの形式が正しくありません' }),
})

/**
 * つながり削除入力の型
 */
export type DeleteConnectionInput = z.infer<typeof deleteConnectionSchema>
