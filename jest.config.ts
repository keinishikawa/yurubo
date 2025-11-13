/**
 * ファイル名: jest.config.ts
 *
 * 【概要】
 * Jestテストフレームワークの設定ファイル
 * Next.js 15環境でTypeScriptとReact Testing Libraryを使用したテストを実行するための設定
 *
 * 【主要機能】
 * - TypeScriptコードのトランスパイル設定
 * - React Testing Libraryのセットアップ
 * - モジュールパスエイリアス設定（@/*）
 * - カバレッジ収集の設定
 */

import type { Config } from "jest";
import nextJest from "next/jest";

/**
 * Next.js用のJest設定を作成
 *
 * 【処理内容】
 * 1. Next.jsプロジェクトのルートディレクトリを指定
 * 2. next/jestがNext.js環境に必要な設定を自動的に適用
 */
const createJestConfig = nextJest({
  // Next.jsアプリのパスを指定（next.config.tsがある場所）
  dir: "./",
});

/**
 * カスタムJest設定
 *
 * 【設定項目】
 * - testEnvironment: jsdomを使用してブラウザ環境をシミュレート
 * - setupFilesAfterEnv: テスト実行前にsetupファイルを読み込み
 * - moduleNameMapper: TypeScriptのパスエイリアスをJestで解決
 * - testMatch: テストファイルのパターン指定
 * - collectCoverageFrom: カバレッジ収集対象ファイルの指定
 */
const config: Config = {
  // jsdom環境でDOMをシミュレート（React Testing Library用）
  testEnvironment: "jest-environment-jsdom",

  // テスト実行前にsetupファイルを読み込む
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // TypeScriptのパスエイリアス（@/*）をJestで解決
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // テストファイルのパターン（E2Eテストを除外）
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/e2e/", // Playwright E2Eテストを除外
  ],

  // カバレッジ収集対象
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
};

/**
 * Next.js用の設定を適用してエクスポート
 *
 * 【処理内容】
 * 1. createJestConfig関数にカスタム設定を渡す
 * 2. Next.jsが必要な追加設定（SWC、モジュール解決など）を自動適用
 * 3. 最終的な設定オブジェクトを返す
 */
export default createJestConfig(config);
