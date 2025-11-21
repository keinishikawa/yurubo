/**
 * ファイル名: playwright.config.ts
 *
 * 【概要】
 * PlaywrightのE2Eテスト設定ファイル
 * Next.jsアプリケーションのエンドツーエンドテストを実行するための設定
 *
 * 【主要機能】
 * - 複数ブラウザ（Chromium, Firefox, WebKit）でのテスト実行
 * - ローカル開発サーバーの自動起動
 * - テストレポートの生成
 * - スクリーンショット・ビデオキャプチャの設定
 */

import { defineConfig, devices } from "@playwright/test";

/**
 * 開発サーバーのポート番号
 * Next.jsのデフォルトポート
 */
const PORT = process.env.PORT || 3000;

/**
 * ベースURL
 * テスト実行時にアクセスするアプリケーションのURL
 */
const baseURL = `http://localhost:${PORT}`;

/**
 * Playwright設定
 *
 * 【設定項目】
 * - testDir: テストファイルの配置ディレクトリ
 * - fullyParallel: 並列実行の有効化
 * - retries: 失敗時のリトライ回数（CI環境では2回）
 * - workers: 並列実行するワーカー数
 * - reporter: テスト結果のレポート形式
 * - use: 共通設定（ベースURL、トレース設定など）
 * - projects: テスト実行するブラウザの設定
 * - webServer: 開発サーバーの起動設定
 */
export default defineConfig({
  // テストファイルの配置場所
  testDir: "./tests/e2e",

  // テストを完全並列実行
  fullyParallel: true,

  // CIでは最初の失敗でテスト全体を停止
  forbidOnly: !!process.env.CI,

  // CI環境では2回リトライ、ローカルでは0回
  retries: process.env.CI ? 2 : 0,

  // CI環境では1ワーカー、ローカルでは並列実行
  workers: process.env.CI ? 1 : undefined,

  // テストレポートの形式
  // - html: HTMLレポート生成
  // - list: コンソール出力
  reporter: [["html"], ["list"]],

  // 全テストで共通の設定
  use: {
    // ベースURL（page.goto('/')でアクセス可能）
    baseURL,

    // 失敗時のトレース収集
    trace: "on-first-retry",

    // スクリーンショット取得タイミング
    screenshot: "only-on-failure",

    // ビデオ録画（失敗時のみ）
    video: "retain-on-failure",
  },

  /**
   * テスト実行するブラウザの設定
   *
   * 【ブラウザ】
   * - Chromium: Chrome/Edge相当
   *
   * 【注意】
   * - Firefox/WebKitは一時的に無効化（WebKitでボタン状態の互換性問題が発生）
   * - US4実装完了後、マルチブラウザテストを再度有効化予定
   *
   * 【処理内容】
   * Chromiumブラウザでテストを実行
   */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // 一時的に無効化: WebKitでボタン無効状態の互換性問題が発生
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    // モバイルブラウザのテスト（必要に応じてコメント解除）
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /**
   * 開発サーバーの起動設定
   *
   * 【処理内容】
   * 1. テスト実行前にNext.js開発サーバーを起動
   * 2. サーバーが起動するまで待機（最大120秒）
   * 3. テスト完了後にサーバーを自動停止
   *
   * 【設定項目】
   * - command: 起動コマンド
   * - url: ヘルスチェック用URL
   * - reuseExistingServer: CI以外では既存サーバーを再利用
   * - timeout: タイムアウト時間（ミリ秒）
   */
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
