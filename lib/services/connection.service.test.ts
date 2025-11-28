/**
 * ファイル名: connection.service.test.ts
 *
 * 【概要】
 * つながりリスト操作サービスの単体テスト
 *
 * 【依存関係】
 * - @supabase/supabase-js: データベースアクセス
 * - Jest: テストフレームワーク
 *
 * @see specs/001-event-creation/spec.md FR-019: つながりリスト未設定時の警告表示
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { getConnectionCount } from './connection.service'

// モック用の型定義
type MockSupabaseClient = {
  from: jest.Mock
  auth: {
    getUser: jest.Mock
  }
}

describe('connection.service', () => {
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    // Supabaseクライアントのモック
    mockSupabase = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn(),
      },
    }
  })

  describe('getConnectionCount', () => {
    it('つながりリスト数を正しく取得する', async () => {
      // Given: 認証済みユーザーとつながりリスト3件
      const currentUserId = 'user-123'

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: currentUserId } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // When: つながり数を取得
      const result = await getConnectionCount(mockSupabase as unknown as SupabaseClient<Database>)

      // Then: 正しいつながり数が返される
      expect(result.count).toBe(3)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('connections')
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', currentUserId)
    })

    it('つながりリストが空の場合、0を返す', async () => {
      // Given: 認証済みユーザーとつながりリスト0件
      const currentUserId = 'user-456'

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: currentUserId } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // When: つながり数を取得
      const result = await getConnectionCount(mockSupabase as unknown as SupabaseClient<Database>)

      // Then: 0が返される
      expect(result.count).toBe(0)
      expect(result.error).toBeNull()
    })

    it('ユーザーが未認証の場合、UNAUTHORIZEDエラーを返す', async () => {
      // Given: 未認証ユーザー
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // When: つながり数を取得
      const result = await getConnectionCount(mockSupabase as unknown as SupabaseClient<Database>)

      // Then: UNAUTHORIZEDエラーが返される
      expect(result.count).toBe(0)
      expect(result.error).toBe('UNAUTHORIZED')
    })

    it('認証エラーの場合、UNAUTHORIZEDエラーを返す', async () => {
      // Given: 認証エラー
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      })

      // When: つながり数を取得
      const result = await getConnectionCount(mockSupabase as unknown as SupabaseClient<Database>)

      // Then: UNAUTHORIZEDエラーが返される
      expect(result.count).toBe(0)
      expect(result.error).toBe('UNAUTHORIZED')
    })

    it('データベースエラーの場合、FETCH_ERRORを返す', async () => {
      // Given: 認証済みユーザーだがDBエラー発生
      const currentUserId = 'user-789'

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: currentUserId } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // When: つながり数を取得
      const result = await getConnectionCount(mockSupabase as unknown as SupabaseClient<Database>)

      // Then: FETCH_ERRORが返される
      expect(result.count).toBe(0)
      expect(result.error).toBe('FETCH_ERROR')
    })

    it('countがnullの場合、0を返す', async () => {
      // Given: 認証済みユーザーだがcountがnull
      const currentUserId = 'user-abc'

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: currentUserId } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: null, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // When: つながり数を取得
      const result = await getConnectionCount(mockSupabase as unknown as SupabaseClient<Database>)

      // Then: 0が返される（nullの場合のデフォルト）
      expect(result.count).toBe(0)
      expect(result.error).toBeNull()
    })

    it('userIdが引数で渡された場合、auth.getUser()を呼ばない（N+1クエリ対策）', async () => {
      // Given: userIdを直接指定
      const userId = 'user-direct-123'

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // When: userIdを引数で渡してつながり数を取得
      const result = await getConnectionCount(mockSupabase as unknown as SupabaseClient<Database>, userId)

      // Then: つながり数が返され、auth.getUser()は呼ばれない
      expect(result.count).toBe(5)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', userId)
    })
  })
})
