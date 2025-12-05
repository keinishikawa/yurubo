/**
 * ファイル名: delete-connection.ts
 *
 * 【概要】
 * つながり削除のServer Action
 * 指定されたつながりを双方向で削除
 *
 * 【処理フロー】
 * 1. 'use server'ディレクティブでサーバーサイド実行を保証
 * 2. 認証状態チェック
 * 3. バリデーション
 * 4. つながりの存在確認
 * 5. 双方向のつながりを削除
 * 6. 結果を返却
 *
 * 【主要機能】
 * - つながり削除（双方向）
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 *
 * @spec FR-009: つながり削除機能
 * @spec US4-4: 削除ボタンを押して確認後、つながりが削除される
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * 削除対象IDのバリデーションスキーマ
 */
const deleteConnectionSchema = z.object({
  targetId: z
    .string({ message: 'ユーザーIDを指定してください' })
    .uuid('ユーザーIDの形式が正しくありません'),
})

/**
 * つながり削除結果の型
 */
export type DeleteConnectionResult = {
  success: true
  message: string
  code: 'CONNECTION_DELETED'
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'CONNECTION_NOT_FOUND' | 'DELETE_ERROR'
}

/**
 * つながり削除Server Action
 *
 * @param targetId - 削除対象のつながり相手のユーザーID
 * @returns 削除結果
 *
 * 【処理内容】
 * 1. Supabase認証から現在のユーザーIDを取得
 * 2. targetIdのバリデーション
 * 3. つながりの存在確認
 * 4. 双方向のつながりを削除（A→B と B→A の両方）
 * 5. 結果を返却
 *
 * 【設計根拠】
 * - つながりは双方向で管理されているため、削除も双方向で行う
 * - ただし、一方のみ存在する場合も考慮して、自分→相手のみ削除可能とする
 */
export async function deleteConnection(
  targetId: string
): Promise<DeleteConnectionResult> {
  // 【ステップ1】認証チェック
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      message: 'ログインが必要です',
      code: 'UNAUTHORIZED'
    }
  }

  // 【ステップ2】バリデーション
  const validated = deleteConnectionSchema.safeParse({ targetId })
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message ?? '入力値が不正です',
      code: 'VALIDATION_ERROR'
    }
  }

  try {
    // 【ステップ3】つながりの存在確認
    const { data: existingConnection, error: fetchError } = await supabase
      .from('connections')
      .select('user_id, target_id')
      .eq('user_id', user.id)
      .eq('target_id', targetId)
      .single()

    if (fetchError || !existingConnection) {
      return {
        success: false,
        message: 'つながりが見つかりません',
        code: 'CONNECTION_NOT_FOUND'
      }
    }

    // 【ステップ4】双方向のつながりを削除
    // 自分→相手のつながりを削除
    const { error: deleteError1 } = await supabase
      .from('connections')
      .delete()
      .eq('user_id', user.id)
      .eq('target_id', targetId)

    if (deleteError1) {
      console.error('Failed to delete connection (user->target):', deleteError1)
      return {
        success: false,
        message: 'つながりの削除に失敗しました',
        code: 'DELETE_ERROR'
      }
    }

    // 相手→自分のつながりも削除（存在する場合のみ）
    const { error: deleteError2 } = await supabase
      .from('connections')
      .delete()
      .eq('user_id', targetId)
      .eq('target_id', user.id)

    if (deleteError2) {
      // 相手→自分のつながりが存在しない場合もあるため、
      // エラーログは出すが失敗とはしない
      console.warn('Failed to delete reverse connection (target->user):', deleteError2)
    }

    return {
      success: true,
      message: 'つながりを削除しました',
      code: 'CONNECTION_DELETED'
    }
  } catch (error) {
    console.error('Unexpected error in deleteConnection:', error)
    return {
      success: false,
      message: 'つながりの削除中にエラーが発生しました',
      code: 'DELETE_ERROR'
    }
  }
}
