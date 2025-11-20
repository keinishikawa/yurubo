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

## ブランチ戦略（Trunk-Based Development）

### 基本方針

- **Trunk-Based Development** を採用
- `main` ブランチは常に動作保証された状態を維持
- すべての変更は PR 経由で `main` に統合（直接 push 禁止）
- Claude / Cursor のセッション単位で責務を分離し、各自専用ブランチで作業

### ブランチ命名規則

| 種別                         | 命名例                       | 内容                                        |
| -------------------------- | ------------------------- | ----------------------------------------- |
| **機能開発（User Story単位）** ⭐CRITICAL | `feature/{3桁Epic番号}-us{US番号}-{機能名}` | 例：`feature/001-us1-event-posting`（UI+API+テスト） |
| **Phase/基盤構築**            | `feature/000-{説明}`        | 例：`feature/000-phase2-foundation`         |
| 環境構築                       | `infra/<対象>`              | 例：`infra/setup-ci`                        |
| バグ修正                       | `fix/<内容>`                | 例：`fix/ui-modal-close`                    |
| リファクタ                      | `refactor/<範囲>`           | 例：`refactor/event-schema`                 |
| 実験／検証                      | `exp/<内容>`                | 例：`exp/claude-prompt-tuning`              |

**⭐ CRITICAL: Epic vs User Story の重要な違い**:
- **Epic**: 複数のUser Storyを含む大きな機能単位（例: Epic 001 = イベント作成機能全体）
- **User Story**: 独立して完結できる小さな機能単位（例: US1 = イベント投稿、US2 = タイムライン閲覧）
- **必須**: 1つのEpicに複数User Storyがある場合、**必ずUser Story単位でブランチを分ける**
- **命名**: `feature/{Epic番号}-us{US番号}-{機能名}` 形式を厳守

**重要原則**:
- **1 User Story = 1ブランチ = 1 PR = UI + API + テスト全部含む**
- SpecKit機能は必ず`feature/{3桁数字}-`形式を使用
- Phase/基盤構築も数字プレフィックスで管理（000番台推奨）

**アンチパターン（禁止）**:
❌ Epic単位のブランチ（例: `feature/001-event-creation`に複数User Storyを混在）
  → 複数セッションでの作業衝突、tasks.md競合、PRが巨大化
❌ 同一ストーリーをUI/APIで分割（例: `001-ui-xxx`, `001-api-xxx`）
  → SpecKitスクリプトが競合し、spec.md編集が衝突する

### 運用ルール

- 1つのブランチは「**1 User Story完結**」に対応（Epicではない）
- UI/API分割せず、1ストーリーを1ブランチで完結させる
- 作業時間の目安：**1〜3時間〜半日で完了できる粒度**
- 作業終了後、PRを作成しCI通過後に`main`へマージ（1 PR = 1 User Story）
- マージ後はブランチ自動削除（GitHub設定推奨）
- 複数User Storyを含むEpicの場合、各User Storyごとに独立したブランチを作成

### 並行開発戦略（Claude複数セッション運用）

**依存関係に基づく並列開発:**

```
# 基盤構築（依存: なし）
feature/000-phase2-foundation ← 最優先でマージ

# Epic 001の並列開発（依存: Phase 2のみ）
feature/001-us1-event-posting  ← User Story 1（イベント投稿）
feature/001-us2-timeline-view  ← User Story 2（タイムライン閲覧）
feature/001-us3-event-edit     ← User Story 3（イベント編集）

# 各User Storyは独立してマージ可能
# US1とUS2は並行開発可能（ファイル衝突なし）
# US3はUS1に依存（イベント作成後に編集機能）
```

**実運用例:**

| セッション     | ブランチ                            | 依存関係          | 状態   |
| --------- | ------------------------------- | ------------- | ---- |
| Claude #1 | `feature/000-phase2-foundation` | なし            | マージ済 |
| Claude #2 | `feature/001-us1-event-posting` | Phase 2マージ済み  | 並列開発 |
| Claude #3 | `feature/001-us2-timeline-view` | Phase 2マージ済み  | 並列開発 |
| Claude #4 | `feature/001-us3-event-edit`    | US1マージ待ち     | 待機中  |

**原則:**
- 依存のないUser Story同士は並列開発OK（例: US1とUS2は独立）
- 依存のあるUser Storyは前のUser Storyのmainマージを待つ（例: US3はUS1に依存）
- 各User Storyは独立したPRで完結（1 PR = 1 User Story）
- Epic全体を1つのPRにまとめない（レビューが困難になるため）
- 各セッションは独立したストーリー番号で作業
- main更新後は `git pull origin main` で差分を早期吸収

### CI / Branch Protection

- `.github/workflows/ci.yml` に lint + test を自動化
- PR時にCIが緑でない場合はマージ不可（保護ルール）
- mainブランチは常にテスト通過済み状態を保証

**GitHub設定例**:
- Require PR before merge ✅
- Require status checks ✅
- Block force pushes ✅
- Delete branch after merge ✅

### PRレビュー確認のベストプラクティス

**重要**: GitHub APIには2種類のコメントエンドポイントが存在します。

| エンドポイント | 取得できるコメント | 用途 |
|--------------|-----------------|------|
| `/repos/{owner}/{repo}/issues/{number}/comments` | **Issue comments**（PR全体への総合コメント） | ClaudeレビューなどのPR全体へのコメント |
| `/repos/{owner}/{repo}/pulls/{number}/comments` | **Review comments**（コード行への指摘） | 特定コード行への指摘コメント |

**推奨コマンド**:
```bash
# ✅ 推奨: gh CLIの高レベルコマンドを使用
gh pr view {PR番号}                    # PR全体の情報を表示
gh pr view {PR番号} --comments         # すべてのコメントを表示
gh pr checks {PR番号}                  # CI/CDステータスを確認

# ⚠️ 低レベルAPI使用時の注意
# Claudeレビューなどの総合コメントを取得する場合
gh api repos/{owner}/{repo}/issues/{PR番号}/comments

# コード行への指摘コメントを取得する場合
gh api repos/{owner}/{repo}/pulls/{PR番号}/comments
```

**注意事項**:
- ClaudeレビューはGitHub Actionsで動作し、**Issue comment**として投稿される
- `/pulls/{number}/comments`ではClaudeレビューが取得できない
- 完全なレビュー情報を得るには両方のエンドポイントを使用するか、`gh pr view --comments`を使用

---

## 開発ワークフロー: SpecKit

SpecKitは仕様優先開発ワークフローです。

### SpecKitコマンド順序

1. **`/speckit.specify`** - 自然言語から機能仕様を作成
2. **`/speckit.clarify`** - 仕様の曖昧な部分を質問
3. **`/speckit.plan`** - 設計成果物と実装計画を生成
4. **`/speckit.tasks`** - 依存関係順のタスクリスト生成
5. **`/speckit.implement`** - タスクを処理して実装（完了タスクを自動的に`[X]`マーク）
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

## テスト戦略と要件

### テスト構成

```
tests/
  unit/       ← Jest + React Testing Library
  e2e/        ← Playwright
```

### テスト層の方針

| 層               | 対象            | 主目的             | 推奨ツール      | 備考             |
| --------------- | ------------- | --------------- | ---------- | -------------- |
| 単体（Unit）        | ロジック・小コンポーネント | ロジック・描画テスト      | Jest + RTL | 状態変化やバリデーションなど |
| 統合（Integration） | コンポーネント間連携    | storeやhooks動作確認 | RTL        | 状況に応じて         |
| E2E（End-to-End） | 画面操作〜API応答    | UXと主要フロー保証      | Playwright | 初期段階はE2EメインでOK |

### 実行ポリシー

- **PR作成時**: Lint + Unit Test（GitHub Actions自動実行）
- **mainマージ前 or 定期実行**: E2E（Playwright）を nightly で実行
- **初期フェーズ**: E2E優先で体験保証、Unit Testは段階的に追加

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
- **対象**: ユーティリティ関数、バリデーションロジック、ビジネスロジック
- **配置**: 実装ファイルと同じディレクトリに `*.test.ts`
- **実行**: `npm test`

#### 2. 統合テスト（Jest）
- **対象**: APIルート、データベース相互作用、コンポーネント間連携
- **配置**: 実装ファイルと同じディレクトリに `route.test.ts` または `integration.test.ts`
- **実行**: `npm test`

#### 3. E2Eテスト（Playwright）
- **対象**: 重要なユーザーフロー、受入シナリオ
- **配置**: `tests/e2e/` にUser Story単位
- **重要**: spec.mdの受入シナリオを**すべて**テストケースに含める
- **実行**: `npm run test:e2e`

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
- ✅ **tasks.md更新**: 完了したタスクは必ず`- [X]`でマーク（/speckit.implementが自動更新）

### CI/CD実行フロー

**.github/workflows/ci.yml**:
- Lint実行（ESLint）
- 単体・統合テスト実行（Jest）
- E2Eテスト実行（Playwright）
- すべて通過で緑チェック → PRマージ可能

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

## 学習補助システム

プロジェクトは**ハイブリッド学習方式**を採用し、コード内コメント（基本）+ `.learning/`ディレクトリ（詳細解説）の2層構造で学習を支援する。

### コメント記述ルール（コード内）

**目的**: コードの可読性を保ちながら、基本的な理解を支援

#### 1. ファイル全体のコメント（ファイル冒頭に記述）

```typescript
/**
 * ファイル名: example.ts
 *
 * 【概要】
 * このファイルの役割を1-2文で説明
 *
 * 【依存関係】
 * - 使用している外部ライブラリとその目的
 *
 * @see .learning/tasks/{epic}/{task_id}.md - 詳細な実装ガイド
 */
```

**変更点**:
- 【処理フロー】【主要機能】は削除 → `.learning/` へ移動
- `@see` タグで学習ガイドへのリンクを追加

#### 2. 関数・コンポーネント単位のコメント

```typescript
/**
 * 関数名の簡潔な説明（1行）
 *
 * @param paramName - パラメータの説明
 * @returns 戻り値の説明
 */
```

**変更点**:
- 【処理内容】【使用例】は削除 → `.learning/` へ移動
- JSDoc形式を維持（IDE補完のため）

#### 3. インラインコメント

```typescript
// 複雑なロジックのみコメント（簡潔に）
const filteredUsers = users.filter(user =>
  user.category_flags[categoryId] === true
);
```

**変更点**:
- 【文法】【処理】タグは削除
- 自明でないロジックのみコメント

---

### .learning/ ディレクトリ構造

**目的**: 詳細な実装ガイド、文法解説、トラブルシューティングを提供

```
.learning/
├── tasks/                    # タスク単位の実装ガイド
│   └── {epic-id}/
│       └── T{task-id}-{task-name}.md
├── guides/                   # 横断的な学習ガイド
│   ├── typescript-basics.md
│   ├── next-app-router.md
│   └── ...
└── references/              # アーキテクチャ参照
    ├── architecture-overview.md
    └── testing-strategy.md
```

#### タスク実装ガイドのテンプレート

`.specify/templates/learning-task-template.md` を参照

**記載内容**:
- 実装概要（spec.mdからの抜粋）
- 技術解説（使用技術、文法・パターン解説）
- 実装手順（ステップバイステップ）
- コード例（Bad/Good比較）
- テストケース
- トラブルシューティング

**作成タイミング**:
- Phase 3以降: タスク実装時に手動作成
- Phase 4以降: `/speckit.implement` による自動生成

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
