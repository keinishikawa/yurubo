/**
 * ファイル名: search-users.ts
 *
 * 【概要】
 * ユーザー検索のServer Action
 * ユーザー名またはIDで友人を検索し、つながり状態も含めて返す
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. バリデーション
 * 3. ユーザー検索（自分を除外）
 * 4. 既存つながり・リクエスト状態をチェック
 * 5. 結果を返却
 *
 * 【主要機能】
 * - ユーザー名またはIDでの検索
 * - 自分自身を検索結果から除外
 * - 既存つながりの判定（is_friend）
 * - 送信済みリクエストの判定（has_pending_request）
 *
 * 【依存関係】
 * - @/lib/supabase/server: Supabase Server Client
 * - @/lib/validation/connections: Zodスキーマ
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { searchUsersSchema } from '@/lib/validation/connections'

/**
 * 検索結果のユーザー型
 */
type SearchedUser = {
  id: string
  display_name: string
  avatar_url: string | null
  is_friend: boolean
  has_pending_request: boolean
}

/**
 * ユーザー検索結果型
 */
type SearchUsersResult =
  | {
      success: true
      message: string
      data: {
        users: SearchedUser[]
      }
    }
  | {
      success: false
      message: string
      code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'FETCH_ERROR'
    }

/**
 * ユーザー検索Server Action
 *
 * @param query - 検索クエリ（display_name or id）
 * @param options - オプション（limit）
 * @returns 検索結果
 *
 * 【処理内容】
 * 1. 認証チェック
 * 2. 入力バリデーション
 * 3. ユーザー検索（自分を除外、display_nameまたはidで部分一致/完全一致）
 * 4. 既存つながり・送信済みリクエストをチェック
 * 5. 結果を返却
 *
 * @spec FR-001: ユーザー名またはIDによる友人検索
 */
export async function searchUsers(
  query: string,
  options?: { limit?: number }
): Promise<SearchUsersResult> {
  // 【ステップ1】認証チェック
  const supabase = createClient()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      message: 'ログインが必要です',
      code: 'UNAUTHORIZED'
    }
  }

  // 【ステップ2】バリデーション
  const validated = searchUsersSchema.safeParse({ query, ...options })
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || '入力値が不正です',
      code: 'VALIDATION_ERROR'
    }
  }

  const { query: searchQuery, limit } = validated.data

  // 【ステップ3】ユーザー検索（自分を除外）
  // UUIDかどうかで検索条件を分岐
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery)

  let usersQuery = supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .neq('id', user.id)
    .limit(limit)

  if (isUuid) {
    // UUID形式の場合はID完全一致検索
    usersQuery = usersQuery.eq('id', searchQuery)
  } else {
    // それ以外はdisplay_nameの部分一致検索
    usersQuery = usersQuery.ilike('display_name', `%${searchQuery}%`)
  }

  const { data: users, error: usersError } = await usersQuery

  if (usersError) {
    console.error('ユーザー検索エラー:', usersError)
    return {
      success: false,
      message: 'ユーザーの検索に失敗しました',
      code: 'FETCH_ERROR'
    }
  }

  if (!users || users.length === 0) {
    return {
      success: true,
      message: 'ユーザーが見つかりませんでした',
      data: { users: [] }
    }
  }

  // 【ステップ4】既存つながり・送信済みリクエストをチェック
  const userIds = users.map((u) => u.id)

  // 既存つながりをチェック
  const { data: connections } = await supabase
    .from('connections')
    .select('target_id')
    .eq('user_id', user.id)
    .in('target_id', userIds)

  const friendIds = new Set(connections?.map((c) => c.target_id) || [])

  // 送信済みリクエストをチェック
  const { data: sentRequests } = await supabase
    .from('connection_requests')
    .select('receiver_id')
    .eq('sender_id', user.id)
    .in('receiver_id', userIds)

  const pendingRequestIds = new Set(sentRequests?.map((r) => r.receiver_id) || [])

  // 【ステップ5】結果を整形して返却
  const searchedUsers: SearchedUser[] = users.map((u) => ({
    id: u.id,
    display_name: u.display_name,
    avatar_url: u.avatar_url,
    is_friend: friendIds.has(u.id),
    has_pending_request: pendingRequestIds.has(u.id)
  }))

  return {
    success: true,
    message: `${searchedUsers.length}件のユーザーが見つかりました`,
    data: { users: searchedUsers }
  }
}
