// @ts-nocheck
/**
 * ファイル名: fetchTimeline.test.ts
 *
 * 【概要】
 * タイムライン取得Server Actionの統合テスト
 *
 * 【依存関係】
 * - Jest: テストフレームワーク
 * - app/actions/fetchTimeline.ts: Server Action
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// モック
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/services/timeline.service', () => ({
  fetchTimeline: jest.fn(),
}))

describe('fetchTimeline Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('タイムライン取得成功時、{success: true, data, hasMore}を返す', async () => {
    // Given: タイムラインサービスが正常にデータを返す
    const { createClient } = await import('@/lib/supabase/server')
    const { fetchTimeline: fetchTimelineService } = await import('@/lib/services/timeline.service')
    const { fetchTimeline } = await import('@/app/actions/fetchTimeline')

    const mockSupabase = {}
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const mockEvents = [
      {
        id: 'event-1',
        category: 'drinking',
        title: '軽く飲みませんか？',
        anon_id: '🍶A',
        status: 'recruiting',
      },
    ]

    ;(fetchTimelineService as jest.Mock).mockResolvedValue({
      data: mockEvents,
      error: null,
      hasMore: true,
    })

    // When: fetchTimeline Server Actionを呼び出し
    const result = await fetchTimeline({ page: 0, limit: 20 })

    // Then: 成功レスポンスが返される
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.hasMore).toBe(true)
    expect(result.code).toBe('SUCCESS')
  })

  it('未認証エラー時、{success: false, code: UNAUTHORIZED}を返す', async () => {
    // Given: タイムラインサービスがUNAUTHORIZEDエラーを返す
    const { createClient } = await import('@/lib/supabase/server')
    const { fetchTimeline: fetchTimelineService } = await import('@/lib/services/timeline.service')
    const { fetchTimeline } = await import('@/app/actions/fetchTimeline')

    const mockSupabase = {}
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    ;(fetchTimelineService as jest.Mock).mockResolvedValue({
      data: [],
      error: 'UNAUTHORIZED',
      hasMore: false,
    })

    // When: fetchTimeline Server Actionを呼び出し
    const result = await fetchTimeline({ page: 0, limit: 20 })

    // Then: エラーレスポンスが返される
    expect(result.success).toBe(false)
    expect(result.code).toBe('UNAUTHORIZED')
    expect(result.message).toBe('ログインが必要です')
  })

  it('データベースエラー時、{success: false, code: FETCH_ERROR}を返す', async () => {
    // Given: タイムラインサービスがFETCH_ERRORを返す
    const { createClient } = await import('@/lib/supabase/server')
    const { fetchTimeline: fetchTimelineService } = await import('@/lib/services/timeline.service')
    const { fetchTimeline } = await import('@/app/actions/fetchTimeline')

    const mockSupabase = {}
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    ;(fetchTimelineService as jest.Mock).mockResolvedValue({
      data: [],
      error: 'FETCH_ERROR',
      hasMore: false,
    })

    // When: fetchTimeline Server Actionを呼び出し
    const result = await fetchTimeline({ page: 0, limit: 20 })

    // Then: エラーレスポンスが返される
    expect(result.success).toBe(false)
    expect(result.code).toBe('FETCH_ERROR')
    expect(result.message).toBe('タイムラインの取得に失敗しました')
  })

  it('予期しないエラー時、{success: false, code: UNKNOWN_ERROR}を返す', async () => {
    // Given: タイムラインサービスが例外をスロー
    const { createClient } = await import('@/lib/supabase/server')
    const { fetchTimeline: fetchTimelineService } = await import('@/lib/services/timeline.service')
    const { fetchTimeline } = await import('@/app/actions/fetchTimeline')

    const mockSupabase = {}
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    ;(fetchTimelineService as jest.Mock).mockRejectedValue(new Error('Unexpected error'))

    // When: fetchTimeline Server Actionを呼び出し
    const result = await fetchTimeline({ page: 0, limit: 20 })

    // Then: 予期しないエラーレスポンスが返される
    expect(result.success).toBe(false)
    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.message).toBe('予期しないエラーが発生しました')
  })
})
