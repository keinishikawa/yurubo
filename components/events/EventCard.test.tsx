/**
 * ファイル名: EventCard.test.tsx
 *
 * 【概要】
 * EventCardコンポーネントの単体テスト
 * 表示内容・フォーマット・匿名性保証を検証
 *
 * 【テスト対象】
 * - イベント情報の正しい表示
 * - 日時・価格帯のフォーマット
 * - 匿名ID表示
 * - オプション項目の表示/非表示
 *
 * 【依存関係】
 * - Jest + React Testing Library
 * - EventCard.tsx: テスト対象コンポーネント
 */

import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { EventCard, type EventCardData } from './EventCard'

/**
 * テストデータ: 完全なイベント情報
 */
const fullEventData: EventCardData = {
  id: 'event-123',
  anon_id: '🍶A',
  category: 'drinking',
  title: '軽く飲みませんか？',
  date_start: '2025-12-01T19:00:00+09:00',
  date_end: '2025-12-01T22:00:00+09:00',
  capacity_min: 3,
  capacity_max: 5,
  price_min: 3000,
  price_max: 5000,
  comment: '仕事終わりに軽く一杯どうですか？',
}

/**
 * テストデータ: オプション項目なし
 */
const minimalEventData: EventCardData = {
  id: 'event-456',
  anon_id: '✈️B',
  category: 'travel',
  title: '週末旅行行きませんか',
  date_start: '2025-12-15T09:00:00+09:00',
  date_end: '2025-12-16T18:00:00+09:00',
  capacity_min: 2,
  capacity_max: 4,
  price_min: null,
  price_max: null,
  comment: null,
}

describe('EventCard Component', () => {
  describe('T048: EventCard表示テスト', () => {
    it('タイトルが表示される', () => {
      render(<EventCard event={fullEventData} />)
      expect(screen.getByText('軽く飲みませんか？')).toBeInTheDocument()
    })

    it('匿名IDが表示される', () => {
      render(<EventCard event={fullEventData} />)
      expect(screen.getByText('🍶A')).toBeInTheDocument()
    })

    it('カテゴリ絵文字が表示される', () => {
      render(<EventCard event={fullEventData} />)
      // カテゴリ絵文字は🍶として表示される
      expect(screen.getByText('🍶')).toBeInTheDocument()
    })

    it('開催日時が正しくフォーマットされる', () => {
      render(<EventCard event={fullEventData} />)
      // 12/01（日）19:00 形式で表示される
      expect(screen.getByText(/12\/1（[日月火水木金土]）19:00/)).toBeInTheDocument()
    })

    it('想定人数が表示される', () => {
      render(<EventCard event={fullEventData} />)
      expect(screen.getByText('3〜5人')).toBeInTheDocument()
    })

    it('価格帯が表示される（両方指定時）', () => {
      render(<EventCard event={fullEventData} />)
      expect(screen.getByText('3,000〜5,000円')).toBeInTheDocument()
    })

    it('コメントが表示される', () => {
      render(<EventCard event={fullEventData} />)
      expect(screen.getByText('仕事終わりに軽く一杯どうですか？')).toBeInTheDocument()
    })

    it('価格帯がnullの場合、価格情報が表示されない', () => {
      render(<EventCard event={minimalEventData} />)
      expect(screen.queryByText(/円/)).not.toBeInTheDocument()
    })

    it('コメントがnullの場合、コメント欄が表示されない', () => {
      const { container } = render(<EventCard event={minimalEventData} />)
      // コメント用のdivが存在しないことを確認
      const commentDiv = container.querySelector('.bg-muted')
      expect(commentDiv).not.toBeInTheDocument()
    })

    it('旅行カテゴリの場合、✈️絵文字が表示される', () => {
      render(<EventCard event={minimalEventData} />)
      expect(screen.getByText('✈️')).toBeInTheDocument()
      expect(screen.getByText('✈️B')).toBeInTheDocument()
    })

    it('投稿者の実名は一切表示されない', () => {
      const { container } = render(<EventCard event={fullEventData} />)
      // host_idやユーザー名に関する情報が含まれていないことを確認
      expect(container.textContent).not.toContain('host')
      expect(container.textContent).not.toContain('user')
      expect(container.textContent).not.toContain('投稿者')
    })
  })
})
