/**
 * ファイル名: get-connections.ts
 *
 * 【概要】
 * つながりリスト取得のServer Action
 * ログインユーザーのつながりリストをフィルタ・検索オプション付きで取得
 *
 * 【処理フロー】
 * 1. 'use server'ディレクティブでサーバーサイド実行を保証
 * 2. 認証状態チェック
 * 3. バリデーション
 * 4. つながりリストをSupabaseから取得
 * 5. フィルタ・検索を適用
 * 6. 結果を返却
 *
 * 【主要機能】
 * - つながりリスト取得
 * - カテゴリフィルタ
 * - 名前検索
 * - ページネーション
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 * - @/lib/validation/connections: バリデーションスキーマ
 *
 * @spec FR-005: つながりリストの一覧表示機能
 * @spec FR-010: カテゴリ別のフィルタ機能
 * @spec FR-011: 名前による検索機能
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getConnectionsSchema, type GetConnectionsInput } from '@/lib/validation/connections'

/**
 * つながりリスト取得結果の型
 */
export type GetConnectionsResult = {
  success: true
  message: string
  data: {
    connections: Array<{
      target: {
        id: string
        display_name: string
        avatar_url: string | null
      }
      category_flags: Record<string, boolean>
      created_at: string
    }>
    total: number
  }
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'FETCH_ERROR'
}

/**
 * つながりリスト取得Server Action
 *
 * @param options - 取得オプション（カテゴリフィルタ、検索、ページネーション）
 * @returns つながりリストと合計件数
 *
 * 【処理内容】
 * 1. Supabase認証から現在のユーザーIDを取得
 * 2. 入力値のバリデーション
 * 3. connectionsテーブルからつながりを取得（users JOINで相手情報も取得）
 * 4. カテゴリフィルタ適用（指定されたカテゴリがOKのつながりのみ）
 * 5. 名前検索適用（display_name部分一致）
 * 6. ページネーション適用
 * 7. 結果を返却
 */
export async function getConnections(
  options?: Partial<GetConnectionsInput>
): Promise<GetConnectionsResult> {
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
  const validated = getConnectionsSchema.safeParse(options ?? {})
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message ?? '入力値が不正です',
      code: 'VALIDATION_ERROR'
    }
  }

  const { category, search, limit, offset } = validated.data

  try {
    // 【ステップ3】つながりリストを取得
    let query = supabase
      .from('connections')
      .select(`
        target_id,
        category_flags,
        created_at,
        users!connections_target_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 【ステップ4】カテゴリフィルタ適用
    // JSONBの特定キーがtrueのレコードのみ取得
    if (category) {
      query = query.eq(`category_flags->>${category}`, 'true')
    }

    // 【ステップ5】名前検索適用
    // users.display_nameでフィルタするためにはJOIN後のフィルタが必要
    // Supabaseの制約上、JOIN後のフィルタは別途処理

    // 【ステップ6】ページネーション適用
    query = query.range(offset, offset + limit - 1)

    const { data: connections, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Failed to fetch connections:', fetchError)
      return {
        success: false,
        message: 'つながりリストの取得に失敗しました',
        code: 'FETCH_ERROR'
      }
    }

    // 結果を整形
    let formattedConnections = (connections ?? []).map((conn) => {
      // usersはオブジェクトとして返される（単一リレーション）
      const targetUser = conn.users as unknown as {
        id: string
        display_name: string
        avatar_url: string | null
      } | null

      return {
        target: {
          id: targetUser?.id ?? conn.target_id,
          display_name: targetUser?.display_name ?? '不明なユーザー',
          avatar_url: targetUser?.avatar_url ?? null
        },
        category_flags: (conn.category_flags as Record<string, boolean>) ?? {},
        created_at: conn.created_at
      }
    })

    // 【ステップ5続き】名前検索をアプリケーション側で適用
    if (search) {
      const searchLower = search.toLowerCase()
      formattedConnections = formattedConnections.filter(
        (conn) => conn.target.display_name.toLowerCase().includes(searchLower)
      )
    }

    return {
      success: true,
      message: 'つながりリストを取得しました',
      data: {
        connections: formattedConnections,
        total: search
          ? formattedConnections.length
          : (count ?? formattedConnections.length)
      }
    }
  } catch (error) {
    console.error('Unexpected error in getConnections:', error)
    return {
      success: false,
      message: 'つながりリストの取得中にエラーが発生しました',
      code: 'FETCH_ERROR'
    }
  }
}
