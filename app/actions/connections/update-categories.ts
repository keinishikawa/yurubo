/**
 * ファイル名: update-categories.ts
 *
 * 【概要】
 * つながりのカテゴリ設定更新のServer Action
 * 特定のつながり相手とのカテゴリ別OK/NGフラグを更新する
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. 入力バリデーション
 * 3. つながりの存在確認
 * 4. ユーザーのenabled_categoriesに対するバリデーション
 * 5. category_flagsの更新
 *
 * 【主要機能】
 * - カテゴリ設定のCRUD（Update）
 * - ユーザーのenabled_categoriesに基づくフィルタリング
 * - 双方向カテゴリ設定の管理
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 * - @/lib/validation/connections: バリデーションスキーマ
 *
 * @spec FR-006: つながりごとのカテゴリ設定機能
 * @spec FR-007: カテゴリ設定は双方向で管理
 * @spec US3-1: 自分が設定したカテゴリのみ表示
 * @spec US3-2: 設定が保存され、次回表示時も反映
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { updateCategoriesSchema } from '@/lib/validation/connections'

/**
 * カテゴリ設定更新の成功レスポンス型
 */
type UpdateCategoriesSuccessResult = {
  success: true
  message: string
  code: 'CATEGORIES_UPDATED'
  data: {
    category_flags: Record<string, boolean>
  }
}

/**
 * カテゴリ設定更新のエラーレスポンス型
 */
type UpdateCategoriesErrorResult = {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'CONNECTION_NOT_FOUND' | 'CATEGORY_NOT_ENABLED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR'
}

/**
 * カテゴリ設定更新のレスポンス型
 */
export type UpdateCategoriesResult = UpdateCategoriesSuccessResult | UpdateCategoriesErrorResult

/**
 * つながりのカテゴリ設定更新Server Action
 *
 * @param targetId - つながり相手のユーザーID
 * @param categoryFlags - カテゴリ別ON/OFFフラグ
 * @returns API統一レスポンス
 *
 * 【処理内容】
 * 1. Supabase認証から現在のユーザーIDを取得
 * 2. 入力値をZodスキーマでバリデーション
 * 3. つながりの存在を確認
 * 4. ユーザーのenabled_categoriesを取得
 * 5. category_flagsがenabled_categoriesに含まれるかチェック
 * 6. connectionsテーブルのcategory_flagsを更新
 *
 * 【使用例】
 * import { updateConnectionCategories } from '@/app/actions/connections/update-categories'
 *
 * const result = await updateConnectionCategories(targetId, {
 *   drinking: true,
 *   travel: false,
 * })
 *
 * if (result.success) {
 *   toast.success(result.message)
 * } else {
 *   toast.error(result.message)
 * }
 *
 * 【エラーコード】
 * - UNAUTHORIZED: 未ログイン
 * - VALIDATION_ERROR: 入力値バリデーションエラー
 * - CONNECTION_NOT_FOUND: つながりが見つからない
 * - CATEGORY_NOT_ENABLED: 無効なカテゴリ（ユーザーのenabled_categoriesに含まれない）
 * - DATABASE_ERROR: データベースエラー
 */
export async function updateConnectionCategories(
  targetId: string,
  categoryFlags: Record<string, boolean>
): Promise<UpdateCategoriesResult> {
  // 【ステップ1】Supabase認証から現在のユーザーを取得
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // 【エラーハンドリング】未ログインの場合
  if (authError || !user) {
    return {
      success: false,
      message: 'ログインが必要です',
      code: 'UNAUTHORIZED',
    }
  }

  const userId = user.id

  // 【ステップ2】入力バリデーション
  const validated = updateCategoriesSchema.safeParse({ targetId, categoryFlags })
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || '入力値が不正です',
      code: 'VALIDATION_ERROR',
    }
  }

  // 【ステップ3】つながりの存在確認
  const { data: connection, error: connectionError } = await supabase
    .from('connections')
    .select('user_id, target_id, category_flags')
    .eq('user_id', userId)
    .eq('target_id', validated.data.targetId)
    .single()

  if (connectionError || !connection) {
    return {
      success: false,
      message: 'つながりが見つかりません',
      code: 'CONNECTION_NOT_FOUND',
    }
  }

  // 【ステップ4】ユーザーのenabled_categoriesを取得
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('enabled_categories')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    return {
      success: false,
      message: 'ユーザー情報の取得に失敗しました',
      code: 'DATABASE_ERROR',
    }
  }

  const enabledCategories = userData.enabled_categories

  // 【ステップ5】category_flagsがenabled_categoriesに含まれるかチェック
  const invalidCategories = Object.keys(validated.data.categoryFlags).filter(
    (category) => !enabledCategories.includes(category)
  )

  if (invalidCategories.length > 0) {
    return {
      success: false,
      message: `無効なカテゴリが含まれています: ${invalidCategories.join(', ')}`,
      code: 'CATEGORY_NOT_ENABLED',
    }
  }

  // 【ステップ6】category_flagsを更新
  // 既存のフラグとマージ（enabled_categoriesに含まれないものは保持）
  const existingFlags = (connection.category_flags as Record<string, boolean>) || {}
  const updatedFlags = {
    ...existingFlags,
    ...validated.data.categoryFlags,
  }

  const { error: updateError } = await supabase
    .from('connections')
    .update({
      category_flags: updatedFlags,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('target_id', validated.data.targetId)

  if (updateError) {
    return {
      success: false,
      message: 'カテゴリ設定の更新に失敗しました',
      code: 'DATABASE_ERROR',
    }
  }

  return {
    success: true,
    message: 'カテゴリを更新しました',
    code: 'CATEGORIES_UPDATED',
    data: {
      category_flags: updatedFlags,
    },
  }
}
