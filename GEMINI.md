# GEMINI.md

このファイルは、Gemini (Antigravity) がこのリポジトリのコードを扱う際のガイダンスを提供します。

---

## プロジェクト憲法 (Project Instructions)

あなたは、このプロジェクトにおける優秀なシニアエンジニアであり、自律的な開発エージェントです。以下のルールを厳守して開発を進めてください。

### 1. 基本行動指針 (Core Behavior)

- **言語:** 思考プロセス、チャット応答、作成するドキュメント、コミットメッセージなど、すべて **日本語** で行ってください。
- **役割:** Next.js (App Router), Supabase, TypeScript のエキスパートとして振る舞ってください。

### 2. GitHub Issue 至上主義 (SSOT Strategy)

このプロジェクトにおける「要件の正解（Single Source of Truth）」は、常に **GitHub Issue** です。

- **情報の優先度:**
  1. **GitHub Issue (最優先/絶対)**
  2. コードベースの現状
  3. `spec.md` / `tasks.md` (これらは初期生成用のアーカイブであり、**実装中は参照しないでください**)

- **タスク着手時のルール:**
  - ユーザーからタスク（Issue番号）を指示された場合、必ず最初にターミナルで `gh issue view <number>` を実行し、最新の要件と文脈を把握してください。
  - Issueの内容とコードの現状が食い違っている場合は、ユーザーに確認を求めてください。

### 3. タスクリストの運用 (Task Management)

AntigravityのUI上にある「Task List (Artifact)」は、**Issueを解決するための「一時的な戦術プラン」**として扱います。

- **作成:** Issueの要件（What）を満たすために必要な、具体的な実装ステップ（How）をTask Listとして生成してください。
- **粒度:** ファイル作成、関数実装、テスト追加など、実行可能なレベルまで分解してください。
- **完了:** Issueが解決（PR作成）された時点で、Task Listは役割を終えます。

### 4. 実装とテスト (TDD & E2E)

- **テスト駆動:** ロジックや機能要件については、実装前にテストケース（再現スクリプトやテストコード）を作成・実行し、失敗することを確認してください。UI実装などの詳細は「ハイブリッドテスト戦略」に従います。
- **E2Eテスト (Playwright):**
  - ブラウザ操作による検証を行った後、その操作手順を **Playwright のテストコードとして永続化** してください。
  - 「手動で確認して終わり」にせず、自動テスト資産を残すことを義務とします。

### 5. 完了の定義 (Definition of Done)

タスクの完了は以下の状態を指します。

1. Issueの要件がすべて満たされている。
2. 関連するテスト（Unit/E2E）がパスしている。
3. **Lintエラー・型エラーが存在しない（`npm run lint`, `npm run type-check` がパスする）。**
4. **GitHub PR が作成されている。**
   - 最後に `gh pr create` を使用してPull Requestを作成してください。
   - PRの本文には `Closes #<issue_number>` を含め、変更内容の要約を記載してください。

### 6. 禁止事項 (Deny List)

- ユーザーの許可なく `spec.md` などの仕様ドキュメントを書き換えないでください。
- 破壊的なコマンド（`rm -rf` 等）は慎重に扱ってください。

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

## 開発方針

### 未リリース段階の実装原則

アプリは未リリース段階のため、以下を厳守：

- **機能フラグ・後方互換レイヤー・バージョン分岐は作成しない**
- すべてのコードは「現在の仕様に対する単一の実装パス」を前提
- 不要な抽象化・汎用化・将来の拡張を見越した設計は行わない
  - 明示的に依頼された場合のみ実装

**目的**: 冗長な実装や複雑な条件分岐を避け、開発初期の効率を最大化

### 技術的な制約 (Technical Constraints)

- ❌ 不要な抽象化・過剰設計
- ❌ 後方互換コード・将来拡張のための分岐
- ❌ 推測による仕様追加

---

## ブランチ戦略（Trunk-Based Development）

### 基本方針

- **Trunk-Based Development** を採用
- `main` ブランチは常に動作保証された状態を維持
- すべての変更は PR 経由で `main` に統合（直接 push 禁止）

### ブランチ命名規則

| 種別                                      | 命名例                                      | 内容                                                 |
| ----------------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| **機能開発（User Story単位）** ⭐CRITICAL | `feature/{3桁Epic番号}-us{US番号}-{機能名}` | 例：`feature/001-us1-event-posting`（UI+API+テスト） |
| **Phase/基盤構築**                        | `feature/000-{説明}`                        | 例：`feature/000-phase2-foundation`                  |
| 環境構築                                  | `infra/<対象>`                              | 例：`infra/setup-ci`                                 |
| バグ修正                                  | `fix/<内容>`                                | 例：`fix/ui-modal-close`                             |
| リファクタ                                | `refactor/<範囲>`                           | 例：`refactor/event-schema`                          |
| ドキュメント                              | `docs/<内容>`                               | 例：`docs/add-gemini-context`                        |
| 実験／検証                                | `exp/<内容>`                                | 例：`exp/ai-prompt-tuning`                           |

**⭐ CRITICAL: Epic vs User Story の重要な違い**:

- **Epic**: 複数のUser Storyを含む大きな機能単位（例: Epic 001 = イベント作成機能全体）
- **User Story**: 独立して完結できる小さな機能単位（例: US1 = イベント投稿、US2 = タイムライン閲覧）
- **必須**: 1つのEpicに複数User Storyがある場合、**必ずUser Story単位でブランチを分ける**
- **命名**: `feature/{Epic番号}-us{US番号}-{機能名}` 形式を厳守

**重要原則**:

- **1 User Story = 1ブランチ = 1 PR = UI + API + テスト全部含む**
- 機能開発は必ず`feature/{3桁数字}-`形式を使用
- Phase/基盤構築も数字プレフィックスで管理（000番台推奨）

**アンチパターン（禁止）**:
❌ Epic単位のブランチ（例: `feature/001-event-creation`に複数User Storyを混在）
→ 複数セッションでの作業衝突、PRが巨大化
❌ 同一ストーリーをUI/APIで分割（例: `001-ui-xxx`, `001-api-xxx`）
→ 仕様編集が衝突する

### 運用ルール

- 1つのブランチは「**1 User Story完結**」に対応（Epicではない）
- UI/API分割せず、1ストーリーを1ブランチで完結させる
- 作業時間の目安：**1〜3時間〜半日で完了できる粒度**
- 作業終了後、PRを作成しCI通過後に`main`へマージ（1 PR = 1 User Story）
- マージ後はブランチ自動削除（GitHub設定推奨）
- 複数User Storyを含むEpicの場合、各User Storyごとに独立したブランチを作成

### 並行開発戦略

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

**原則:**

- 依存のないUser Story同士は並列開発OK（例: US1とUS2は独立）
- 依存のあるUser Storyは前のUser Storyのmainマージを待つ（例: US3はUS1に依存）
- 各User Storyは独立したPRで完結（1 PR = 1 User Story）
- Epic全体を1つのPRにまとめない（レビューが困難になるため）
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

| エンドポイント                                   | 取得できるコメント                           | 用途                               |
| ------------------------------------------------ | -------------------------------------------- | ---------------------------------- |
| `/repos/{owner}/{repo}/issues/{number}/comments` | **Issue comments**（PR全体への総合コメント） | AIレビューなどのPR全体へのコメント |
| `/repos/{owner}/{repo}/pulls/{number}/comments`  | **Review comments**（コード行への指摘）      | 特定コード行への指摘コメント       |

**推奨コマンド**:

```bash
# ✅ 推奨: gh CLIの高レベルコマンドを使用
gh pr view {PR番号}                    # PR全体の情報を表示
gh pr view {PR番号} --comments         # すべてのコメントを表示
gh pr checks {PR番号}                  # CI/CDステータスを確認

# ⚠️ 低レベルAPI使用時の注意
# AIレビューなどの総合コメントを取得する場合
gh api repos/{owner}/{repo}/issues/{PR番号}/comments

# コード行への指摘コメントを取得する場合
gh api repos/{owner}/{repo}/pulls/{PR番号}/comments
```

**注意事項**:

- AIレビューはGitHub Actionsで動作し、**Issue comment**として投稿される
- `/pulls/{number}/comments`ではAIレビューが取得できない
- 完全なレビュー情報を得るには両方のエンドポイントを使用するか、`gh pr view --comments`を使用

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

### ハイブリッドテスト戦略 (Hybrid Testing Strategy)

**「堅牢なロジック」と「柔軟なUI開発」を両立させるため、以下の戦略を採用します。**

| 対象                     | テスト方針                   | 具体的なアクション                                               |
| :----------------------- | :--------------------------- | :--------------------------------------------------------------- |
| **ロジック・複雑な処理** | **TDD (Test Driven)**        | 実装前にUnit Test (Jest) を書き、ロジックの正当性を保証する。    |
| **UI / UX**              | **試行錯誤 (Trial & Error)** | Unit Test不要。ブラウザでの目視確認と微調整を優先する。          |
| **User Story (機能)**    | **E2E (Playwright)**         | **PR作成前の必須要件**。機能全体が正しく動作することを保証する。 |

### テスト構成

```
tests/
  unit/       ← Jest (ロジック用)
  e2e/        ← Playwright (User Story検証用)
```

### テスト実行ガイドライン

#### 1. ロジック実装時 (TDD)

- 対象: ユーティリティ関数、複雑なデータ変換、バリデーションロジック
- 手順:
  1. `tests/unit/` にテストファイルを作成
  2. テストケースを記述 (Fail)
  3. 実装 (Pass)
  4. リファクタリング

#### 2. UI実装時

- 対象: コンポーネントの見た目、単純なインタラクション
- 手順:
  1. Storybookや実際の画面で確認しながら実装
  2. 複雑な状態管理が含まれる場合のみ、そのロジック部分を切り出してUnit Testする

#### 3. 機能完成時 (E2E)

- 対象: User Story全体のフロー
- 手順:
  1. `tests/e2e/` にUser Story単位のテストを作成
  2. 正常系・異常系の主要シナリオを網羅
  3. `npm run test:e2e` がパスすることを確認してからPRを作成

### CI/CD実行フロー

**.github/workflows/ci.yml**:

- Lint & Type Check
- Unit Test (Jest)
- E2E Test (Playwright)
- **すべて通過でマージ可能**

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
const filteredUsers = users.filter((user) => user.category_flags[categoryId] === true);
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
