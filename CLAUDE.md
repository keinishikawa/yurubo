# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### 7. 外部記憶管理 (Harness Protocol)

AIの記憶やチャット履歴に依存せず、以下の2つのファイルを「正」として参照・更新してください。
（参考: Anthropic「Effective harnesses for long-running agents」）

#### A. `ROADMAP.md` （長期記憶 / Git管理）

- **役割**: Epic/マイルストーン単位の進捗ダッシュボード
- **内容**: プロジェクト概要、アーキテクチャ概要、Epic進捗一覧
- **更新タイミング**: User Story完了時（PRマージ後）
- **注意**: 詳細仕様は記載しない（`docs/`, `specs/` を参照）

#### B. `current_task.md` （短期記憶 / Git管理外）

- **役割**: 現在のワークツリーにおける作業ログ
- **内容**: 現在のIssue番号、思考プロセス、エラーログ、次のステップ
- **更新タイミング**: 作業の1ステップごと（頻繁に更新）
- **Git運用**: `.gitignore` に追加済み。**絶対にコミットしないこと。**
  - 理由: `git worktree` 並列開発時のマージコンフリクト防止
- **新規worktree作成時**: テンプレートからコピーして作成
  ```bash
  cp current_task.template.md current_task.md
  ```

#### 作業プロトコル

1. **Initialize（状況把握）**:
   - `gh issue view <number>` で最新の要件を確認
   - `ROADMAP.md` でプロジェクト全体像を把握
   - `current_task.md` で直前の作業状況を把握（なければ作成）

2. **Plan（計画）**:
   - `current_task.md` に「これからやるタスク」と「検証方法」を記述

3. **Act & Update（実行と記録）**:
   - コードを実装・テストを実行
   - **重要**: 結果（成功/失敗）と次のアクションを `current_task.md` に追記

4. **Commit（セーブ）**:
   - タスク完了＋テストパス後にGitコミット
   - ※ `current_task.md` はコミットに含めない

5. **Milestone Update（マイルストーン更新）**:
   - PRマージ後、`ROADMAP.md` の進捗を更新

---

## プロジェクト概要

**ゆるぼ (YURUBO)** は、人間関係の「誘う・断る」摩擦をゼロにする匿名型イベント調整プラットフォーム。

> SNS が「見る関係」を作ったのであれば、ゆるぼは「動く関係」を作る。

**現在の状態**: 初期企画・仕様策定フェーズ（実装中）

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

- **未リリース段階の実装原則**:
  - 機能フラグ・後方互換レイヤー・バージョン分岐は作成しない
  - 「現在の仕様に対する単一の実装パス」のみを記述
  - 不要な抽象化・汎用化は行わない（YAGNI）
- **禁止事項**:
  - ❌ 不要な抽象化・過剰設計
  - ❌ 推測による仕様追加

### 技術的な制約 (Technical Constraints)

- ❌ 不要な抽象化・過剰設計
- ❌ 後方互換コード・将来拡張のための分岐
- ❌ 推測による仕様追加

---

## ブランチ戦略（Trunk-Based Development）

### 基本方針

- **Trunk-Based Development** を採用
- `main` ブランチは常に動作保証された状態を維持
- すべての変更は PR 経由で `main` に統合

### ブランチ命名規則

| 種別         | 命名例                                      | 備考                                |
| ------------ | ------------------------------------------- | ----------------------------------- |
| **機能開発** | `feature/{3桁Epic番号}-us{US番号}-{機能名}` | 例：`feature/001-us1-event-posting` |
| **基盤構築** | `feature/000-{説明}`                        | 例：`feature/000-phase2-foundation` |
| **修正/他**  | `fix/...`, `refactor/...`, `docs/...`       |                                     |

**重要**: 1つのブランチは「**1 User Story完結**」に対応させる（Epic単位ではない）。

### コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/)に従います。

**フォーマット**:

```
<type>(<scope>): <subject>
```

※ `<subject>` は日本語で記述してください。

**Type一覧**:

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの動作に影響しない変更（フォーマット等）
- **refactor**: バグ修正や機能追加ではないコード変更
- **test**: テストの追加・修正
- **chore**: ビルドプロセスやツールの変更

**運用ルール**:

- **こまめなコミット**: 作業の論理的な区切り（1つの関数実装、1つのテスト追加など）ごとにコミットすることを推奨します。
- **WIPコミット**: 作業途中でも `wip: ...` としてコミットし、進捗を保存することを許容します。

### Pull Request ガイドライン

**PRタイトル**: `[機能番号] 簡潔な説明`
例: `[001-US1] イベント投稿機能の実装`

**PR説明テンプレート**:

```markdown
## 概要

[何を実装したか]

## User Story

[関連するUser Story]

## 変更内容

- [変更点1]

## テスト

- [ ] 単体テスト: すべてパス
- [ ] E2Eテスト: 該当シナリオパス

## チェックリスト

- [ ] 型エラーなし
- [ ] リントエラーなし
```

**ベストプラクティス**:

- **User Story単位のPR**: 1PR = 1 User Story
- **self-review**: PRを出す前に自分でコードを見直す
- **tasks.mdの更新**: タスク完了時は必ず`[X]`でマーク

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

### 統一レスポンス形式

```typescript
{
  success: boolean;
  message: string; // 日本語
  code?: string;
  data?: T;
}
```

### 原則

- すべてのユーザー入力をバリデーション（Zod使用）
- エラーメッセージは日本語で明確に
- エラーはログに記録する

---

## 学習補助システム

### コードコメント記述ルール

- **ファイル冒頭**: 概要と依存関係、`@see .learning/tasks/...` へのリンク
- **関数/メソッド**: JSDoc形式で説明、引数、戻り値を記述
- **インライン**: 複雑なロジックのみ簡潔に

### .learning/ ディレクトリ

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

### 読み込むべきファイル優先順位

1. **必須**: CLAUDE.md / GEMINI.md
2. **仕様**: specs/{epic-id}/spec.md
3. **設計**: specs/{epic-id}/plan.md
4. **タスク**: specs/{epic-id}/tasks.md

### 重要な参照ドキュメント

- [docs/firstspec.md](docs/firstspec.md) - 詳細仕様
- [docs/techplan.md](docs/techplan.md) - 技術仕様
