# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## プロジェクト概要

**ゆるぼ (YURUBO)** は、人間関係の「誘う・断る」摩擦をゼロにする匿名型イベント調整プラットフォーム。

> SNS が「見る関係」を作ったのであれば、ゆるぼは「動く関係」を作る。

**現在の状態**: 初期企画・仕様策定フェーズ（実装前）

### アーキテクチャ概要

| 層              | 技術                                           |
| --------------- | ---------------------------------------------- |
| Frontend        | Next.js 15 / TypeScript / Tailwind / shadcn-ui |
| Backend         | Supabase (DB + Realtime + Auth)                |
| AI              | GPT-4o API                                     |
| API Integration | Google Places                                  |
| Payment         | Stripe / PayPay リンク                         |
| Infra           | Vercel / Supabase Cloud                        |

**主要データモデル**: users, events, participants, stores, messages, settlements, tasks

詳細は [docs/techplan.md](docs/techplan.md) を参照。

### 設計哲学

> **AI が段取りを整え、人が決める**

- AIは候補提示まで。確定操作は必ず人間が行う
- 店舗予約などの決済・契約操作は自動化しない

---

## 応答言語

- **応答言語**: 日本語
- **コードコメント**: すべて日本語で記述
- **技術用語**: 英語のまま使用可（例: Server Components, Props）
- **変数名・関数名**: 英語（言語規約に従う）

---

## 開発方針

### 未リリース段階の実装原則

アプリは未リリース段階のため、以下を厳守：

- **機能フラグ・後方互換レイヤー・バージョン分岐は作成しない**
- すべてのコードは「現在の仕様に対する単一の実装パス」を前提
- 不要な抽象化・汎用化・将来の拡張を見越した設計は行わない
  - 明示的に依頼された場合のみ実装

**目的**: 冗長な実装や複雑な条件分岐を避け、開発初期の効率を最大化

### 実行環境制約

- **Python等のランタイムコードを実行しない**
- 静的なコード例・疑似コード・構造の説明を優先
- ファイル操作、環境変数、パッケージインストールなど実行環境依存処理は記述しない
- 「実行した場合の推定結果」提示も行わない

**目的**: 存在しない実行環境を前提にした回答による混乱を防ぐ

### 応答ポリシー

- 不明点は推測せず、必要な情報を明確に質問
- 問題解決に関係のない文言（雑談・感謝など）は含めない
- 回答は質問内容に直接関連したものに限定、冗長な文章を避ける

### 禁止事項

- ❌ 不要な抽象化・過剰設計
- ❌ 後方互換コード・将来拡張のための分岐
- ❌ Python等のコード実行
- ❌ 環境依存処理の自動追加
- ❌ 推測による仕様追加

### 期待されるアウトプット

- ✅ 明確でシンプルな実装方針
- ✅ 過度な抽象化や技術的複雑性のないコード
- ✅ 必要な場合のみ追加ヒアリング
- ✅ 静的コード例・非実行前提の構造化された出力

---

## 開発ワークフロー: SpecKit

SpecKitは仕様優先開発ワークフローです。

### SpecKitコマンド順序

1. **`/speckit.specify`** - 自然言語から機能仕様を作成
2. **`/speckit.clarify`** - 仕様の曖昧な部分を質問
3. **`/speckit.plan`** - 設計成果物と実装計画を生成
4. **`/speckit.tasks`** - 依存関係順のタスクリスト生成
5. **`/speckit.implement`** - タスクを処理して実装
6. **`/speckit.analyze`** - 成果物間の整合性分析
7. **`/speckit.checklist`** - 機能固有チェックリスト生成

### 基本原則

- 新機能実装時は必ず`/speckit.specify`から開始
- 仕様フェーズをスキップしない
- テンプレートは`.specify/templates/`を使用

---

## 主要な設計原則

### 1. ストーリー駆動開発

- 実装は**ユーザーストーリー**を中心に組織化
- 各ストーリーには受入基準、バリデーションルール、エラーハンドリングを含む

### 2. シンプルさ優先（YAGNI）

- 最小構成で動く実装を構築
- 複雑なオーケストレーションは延期
- 「小さな関数を積み重ねる」哲学

### 3. 型安全性とバリデーション

- TypeScript strict mode使用
- Zodなどでバリデーションスキーマを定義
- フロントエンドとバックエンドでスキーマ再利用

---

## テスト要件と原則

### TDD（Test-Driven Development）必須

**🚨 すべての実装コードには対応するテストが必須**

### Bottom-Up TDD Workflow

```
Phase 1: 要件理解
  ↓
Phase 2: 単体テスト（RED → GREEN → REFACTOR）
  ↓
Phase 3: 統合テスト
  ↓
Phase 4: E2Eテスト（受入シナリオ全カバー）
```

### テストカバレッジ要件

#### 1. 単体テスト（Jest）
- **対象**: ユーティリティ関数、バリデーションロジック
- **配置**: 実装ファイルと同じディレクトリに `*.test.ts`

#### 2. 統合テスト（Jest）
- **対象**: APIルート、データベース相互作用
- **配置**: 実装ファイルと同じディレクトリに `route.test.ts`

#### 3. E2Eテスト（Playwright等）
- **対象**: 重要なユーザーフロー
- **配置**: `tests/e2e/` にUser Story単位
- **重要**: spec.mdの受入シナリオを**すべて**テストケースに含める

### テスト作成のガイドライン

1. **受入基準をテスト仕様として使用**
   - spec.mdの受入シナリオ → テストケース
   - Given-When-Then形式を活用

2. **AAA パターン**
   ```typescript
   test('タイトルが有効な場合イベントを保存', async () => {
     // Arrange: 準備
     const eventData = { title: 'テストイベント' };

     // Act: 実行
     const result = await saveEvent(eventData);

     // Assert: 検証
     expect(result.success).toBe(true);
   });
   ```

3. **テストは独立させる**
   - 他のテストに依存しない
   - 実行順序に依存しない

4. **エラーケースを含める**
   - 正常系・異常系の両方をテスト

### タスク完了の定義（Definition of Done）

- ✅ Phase 2: 単体テスト作成済み、すべてパス
- ✅ Phase 3: 統合テスト作成済み、すべてパス
- ✅ Phase 4: E2Eテスト作成済み、受入シナリオ全カバー
- ✅ 型エラーなし
- ✅ リントエラーなし

---

## エラーハンドリング

### 統一されたエラーレスポンス形式

```typescript
// 成功時
{
  success: true,
  message: '成功メッセージ',
  code: 'SUCCESS_CODE'
}

// エラー時
{
  success: false,
  message: 'エラーメッセージ',
  code: 'ERROR_CODE'
}
```

### 原則

- すべてのユーザー入力をバリデーション
- エラーメッセージは日本語で明確に
- 一時的な障害はリトライロジック実装
- エラーをログに記録

---

## 学習補助モード

すべての実装コードには**学習補助を目的とした詳細な日本語コメント**を必ず含めること。

### コメント記述の必須要件

#### 1. ファイル全体のコメント（ファイル冒頭に記述）

各ファイルの冒頭に以下を含むコメントブロックを追加:

```typescript
/**
 * ファイル名: example.ts
 *
 * 【概要】
 * このファイルの役割を1-2文で説明
 *
 * 【処理フロー】
 * 1. どのような順序で処理が実行されるか
 * 2. 主要な関数・コンポーネントの呼び出し順
 * 3. データの流れ（入力 → 処理 → 出力）
 *
 * 【主要機能】
 * - 機能1: 説明
 * - 機能2: 説明
 *
 * 【依存関係】
 * - 使用している外部ライブラリとその目的
 * - 他のモジュールとの関係
 */
```

#### 2. 処理単位のコメント（関数・コンポーネント単位）

各関数・コンポーネントに以下を含むコメントを追加:

```typescript
/**
 * 関数名の説明
 *
 * @param paramName - パラメータの説明と型の意味
 * @returns 戻り値の説明と型の意味
 *
 * 【処理内容】
 * 1. どのような処理を行うか（ステップバイステップ）
 * 2. 使用している文法の説明（map, filter, async/awaitなど）
 * 3. エッジケースへの対応
 *
 * 【使用例】
 * const result = await functionName(param);
 */
```

#### 3. ロジック内のインラインコメント

複雑なロジックには行ごとまたはブロックごとにコメントを追加:

```typescript
// 【文法】Array.filter() - 条件に一致する要素のみを抽出
// 【処理】つながりリスト内で該当カテゴリがOKのユーザーのみを取得
const filteredUsers = users.filter(user =>
  // category_flagsはJSONB型で、各カテゴリの許可状態を保持
  user.category_flags[categoryId] === true
);
```

### エラー発生時の対応

#### エラー連続時の対応手順

実装中に**同じエラーが2回以上連続して発生した場合**、以下の手順を実行:

1. **エラー分析を実施**
   - エラーメッセージの詳細を確認
   - スタックトレースから原因箇所を特定
   - 関連するファイル・設定を確認

2. **ユーザーに修正方針を提示**
   ```
   【エラー分析結果】
   - エラー内容: [エラーメッセージ]
   - 原因: [推定される原因]
   - 影響範囲: [影響を受けるファイル・機能]

   【提案する修正方針】
   A案: [方針1の説明とメリット・デメリット]
   B案: [方針2の説明とメリット・デメリット]

   どの方針で進めますか？または別のアプローチをご希望ですか？
   ```

3. **ユーザーの判断を待つ**
   - 自動的に修正を試みない
   - 複数の選択肢を提示し、ユーザーに選択させる

#### エラー発生を防ぐための原則

- 型定義を厳密に行う（TypeScript strict mode）
- バリデーションを必ず実装する
- テストファーストで実装する
- 小さい単位でコミット・検証する

---

## ベストプラクティス

1. **常にSpecKitワークフローを使用** - 仕様フェーズをスキップしない
2. **ユーザーストーリーに対してバリデーション** - 各機能をストーリーにマッピング
3. **テストファーストで記述** - 受入基準をテスト仕様として使用
4. **シンプルに保つ** - 早すぎる最適化や複雑な抽象化を避ける
5. **エラーメッセージ** - 明確で実行可能な日本語メッセージ
6. **一貫したAPI形式** - 常に `{ success, message, code }` 構造

---

## 開発コマンド（実装後に使用）

### プロジェクト初期化

```bash
# Next.js 15プロジェクト作成
npx create-next-app@latest . --typescript --tailwind --app

# 必要なパッケージインストール
npm install @supabase/supabase-js zod react-hook-form @hookform/resolvers
npm install -D @testing-library/react @testing-library/jest-dom jest @playwright/test

# Supabaseプロジェクト初期化
npx supabase init
```

### 開発・テスト・ビルド

```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test              # Jest単体テスト
npm run test:e2e      # Playwright E2Eテスト

# ビルド・型チェック
npm run build
npm run type-check

# リント
npm run lint
```

---

## 重要な参照ドキュメント

- [docs/firstspec.md](docs/firstspec.md) - 詳細仕様（6フェーズ設計、UI構成）
- [docs/techplan.md](docs/techplan.md) - 技術仕様（データモデル、AIモジュール、通知ロジック）
- [docs/figma.md](docs/figma.md) - UI/UXフロー、画面遷移、Prototypeガイド

## Active Technologies
- TypeScript 5.x / Next.js 15 (App Router) + React 19, Supabase Client, Zod, React Hook Form, shadcn-ui, TailwindCSS (001-event-creation)
- Supabase (PostgreSQL 15) with Row-Level Security (001-event-creation)

## Recent Changes
- 001-event-creation: Added TypeScript 5.x / Next.js 15 (App Router) + React 19, Supabase Client, Zod, React Hook Form, shadcn-ui, TailwindCSS
