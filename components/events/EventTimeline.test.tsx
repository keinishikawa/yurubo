/**
 * ファイル名: EventTimeline.test.tsx
 *
 * 【概要】
 * EventTimelineコンポーネントの単体テスト
 *
 * 【依存関係】
 * - React Testing Library: UIテスト
 * - Jest: テストフレームワーク
 */

import { render, screen, waitFor } from '@testing-library/react'
import { EventTimeline } from './EventTimeline'
import type { Database } from '@/lib/supabase/types'

type Event = Database['public']['Tables']['events']['Row']

// fetchTimelineのモック
jest.mock('@/app/actions/fetchTimeline', () => ({
  fetchTimeline: jest.fn(),
}))

// EventCardのモック
jest.mock('@/components/events/EventCard', () => ({
  EventCard: ({ event }: { event: Event }) => (
    <div data-testid={`event-card-${event.id}`}>{event.title}</div>
  ),
}))

describe('EventTimeline', () => {
  const mockEvents: Event[] = [
    {
      id: 'event-1',
      category: 'drinking',
      title: '軽く飲みませんか？',
      anon_id: '🍶A',
      date_start: '2025-12-01T19:00:00Z',
      date_end: '2025-12-01T22:00:00Z',
      capacity_min: 3,
      capacity_max: 5,
      price_min: 3000,
      price_max: 5000,
      comment: '仕事終わりに軽く一杯',
      status: 'recruiting',
      host_id: 'user-123',
      deadline: null,
      created_at: '2025-11-14T10:00:00Z',
      updated_at: '2025-11-14T10:00:00Z',
    },
    {
      id: 'event-2',
      category: 'travel',
      title: '週末旅行行きませんか？',
      anon_id: '✈️B',
      date_start: '2025-12-15T09:00:00Z',
      date_end: '2025-12-16T18:00:00Z',
      capacity_min: 2,
      capacity_max: 4,
      price_min: 10000,
      price_max: 15000,
      comment: '温泉旅行',
      status: 'recruiting',
      host_id: 'user-456',
      deadline: null,
      created_at: '2025-11-14T11:00:00Z',
      updated_at: '2025-11-14T11:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initialEventsが渡された場合、初期表示する', () => {
    // When: initialEventsを渡してレンダリング
    render(<EventTimeline initialEvents={mockEvents} />)

    // Then: イベントが表示される
    expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument()
    expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument()
    expect(screen.getByText('軽く飲みませんか？')).toBeInTheDocument()
    expect(screen.getByText('週末旅行行きませんか？')).toBeInTheDocument()
  })

  it('イベントが0件の場合、空状態メッセージを表示する', async () => {
    // Given: fetchTimelineが空配列を返す
    const { fetchTimeline } = await import('@/app/actions/fetchTimeline')
    ;(fetchTimeline as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      hasMore: false,
      message: 'タイムラインを取得しました',
      code: 'SUCCESS',
    })

    // When: initialEventsなしでレンダリング
    render(<EventTimeline />)

    // Then: 空状態メッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('まだイベントがありません')).toBeInTheDocument()
    })
  })

  it('ローディング中はスケルトンを表示する', async () => {
    // Given: fetchTimelineが遅延して返す
    const { fetchTimeline } = await import('@/app/actions/fetchTimeline')
    ;(fetchTimeline as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: mockEvents,
                hasMore: false,
                message: 'タイムラインを取得しました',
                code: 'SUCCESS',
              }),
            100
          )
        )
    )

    // When: レンダリング
    render(<EventTimeline />)

    // Then: ローディングスケルトンが表示される
    expect(screen.getAllByRole('generic').some((el) => el.className.includes('animate-pulse'))).toBe(true)
  })

  it('エラー時はエラーメッセージを表示する', async () => {
    // Given: fetchTimelineがエラーを返す
    const { fetchTimeline } = await import('@/app/actions/fetchTimeline')
    ;(fetchTimeline as jest.Mock).mockResolvedValue({
      success: false,
      message: 'タイムラインの取得に失敗しました',
      code: 'FETCH_ERROR',
    })

    // When: レンダリング
    render(<EventTimeline />)

    // Then: エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('タイムラインの取得に失敗しました')).toBeInTheDocument()
    })
  })

  it('hasMore=falseの場合、末尾メッセージを表示する', () => {
    // When: hasMore=falseで大量のイベントを表示
    render(<EventTimeline initialEvents={mockEvents} />)

    // Mock fetchTimeline to return hasMore=false
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { fetchTimeline } = require('@/app/actions/fetchTimeline')
    ;(fetchTimeline as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      hasMore: false,
      message: 'タイムラインを取得しました',
      code: 'SUCCESS',
    })

    // Then: 末尾メッセージが表示される（イベントがある場合のみ）
    expect(screen.getByText('すべてのイベントを表示しました')).toBeInTheDocument()
  })
})
