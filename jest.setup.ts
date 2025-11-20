/**
 * ファイル名: jest.setup.ts
 *
 * 【概要】
 * Jest実行前に一度だけ実行されるセットアップファイル
 * Testing Libraryのカスタムマッチャーを有効化
 *
 * 【処理内容】
 * 1. @testing-library/jest-domをインポート
 * 2. カスタムマッチャー（toBeInTheDocument等）をJestに登録
 *
 * 【使用例】
 * テスト内で以下のようなアサーションが使用可能になる:
 * - expect(element).toBeInTheDocument()
 * - expect(element).toHaveTextContent("text")
 * - expect(element).toBeVisible()
 */

import "@testing-library/jest-dom";

/**
 * IntersectionObserverのモック
 * EventTimelineコンポーネントで使用されるIntersectionObserverをJest環境でモック
 */
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;
