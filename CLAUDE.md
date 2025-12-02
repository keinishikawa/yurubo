# CLAUDE.md

Claude Code 向けプロジェクト設定ファイル

---

## 1. 基本設定

- **言語**: すべて日本語（コード・コミット・ドキュメント）
- **役割**: Next.js (App Router), Supabase, TypeScript エキスパート
- **開発手法**: TDD（Test-Driven Development）必須

### 実装開始時の必須ステップ

**新しいタスクを開始する際は、必ず以下の順序で実行：**

1. **Issue確認**: `gh issue view <number>` で要件を確認
2. **TDD開始**: 実装前にテストを作成（RED状態を確認）
3. **最小実装**: テストが通る最小限のコードを書く（GREEN状態）
4. **リファクタリング**: コードを改善（テストは通ったまま）

**禁止事項：**
- ❌ テストなしでの実装
- ❌ 実装後のテスト追加（後付けテスト）
- ❌ Issueを読まずに実装開始

---

## 2. GitHub Issue 至上主義 (SSOT)

**要件の正解は常に GitHub Issue**

```bash
# タスク着手時に必ず実行
gh issue view <number>
```

- Issue > コードベース > spec.md/tasks.md（参考程度）
- 食い違いがあればユーザーに確認

---

## 3. コンテキスト継続

**セッション開始時・autocompact後・再開時に実行:**

```bash
# 1. 現在のブランチとIssueを確認
git branch --show-current
gh issue develop --list  # 紐付いたIssue確認

# 2. 作業状態を確認
git status && git log --oneline -5

# 3. Issue詳細確認
gh issue view <number> --comments
```

**ワークツリー作成フロー:**

```bash
# Issueと紐付いたブランチを作成
gh issue develop <issue_number> --name feature/001-us1-xxx

# ワークツリー作成（.env.localも自動コピーされる）
git gtr new <branch_name>
```

**SpecKitコマンドの使用（オプション）:**

SpecKitの自動実装ワークフローを使う場合：

```bash
# IMPORTANT: featureブランチでのみ実行可能（mainでは実行不可）
# ワークツリー内、またはfeatureブランチに切り替えてから実行

/speckit.implement   # tasks.mdに従って段階的に実装
```

**注意:**
- `/speckit.implement`は**mainブランチでは実行できません**
- 必ず`feature/`ブランチで実行すること
- ワークツリー内で実行するのが推奨

**作業中の記録:**

- 重要な判断・ブロッカーはGitHub Issueにコメント
- WIPでもこまめにコミット（意味のあるメッセージで）

---

## 4. 完了の定義

1. Issue要件を満たしている
2. テスト（Unit/E2E）がパス
3. `npm run lint` & `npm run type-check` がパス
4. PR作成済み（`Closes #<issue_number>` を含む）
5. **CI全チェック通過**（claude-reviewのCritical Issues修正含む）

---

## 5. テスト戦略（TDD必須）

**IMPORTANT: このプロジェクトはTDD（Test-Driven Development）を採用しています**

### TDDサイクル（Red-Green-Refactor）

**すべての実装は以下の順序で行うこと：**

1. **RED**: 失敗するテストを先に書く
2. **GREEN**: テストが通る最小限の実装を書く
3. **REFACTOR**: コードを改善する

### テスト種別と実行タイミング

| 種別             | 対象                             | 実装順序                           |
| ---------------- | -------------------------------- | ---------------------------------- |
| Unit (Jest)      | ビジネスロジック、ユーティリティ | **実装前**にテスト作成（TDD必須） |
| E2E (Playwright) | User Story全体の動作             | **実装前**にテスト作成（TDD必須） |
| 目視確認         | レイアウト崩れ、アニメーション   | 実装中のみ（自動化困難な項目）     |

### push前チェックリスト

```bash
# 全チェックを一括実行（推奨）
npm run precheck

# 個別実行する場合:
# npm run lint && npm run type-check && npm test && npm run test:e2e
```

### 目視確認の定義

目視確認はテストで自動化しづらい以下の項目に限定:

- レスポンシブレイアウトの崩れ
- アニメーション・トランジションの滑らかさ
- 色・フォントの視認性

**注意**: 機能動作の確認は目視ではなくE2Eで担保すること

### TDD実装フロー（厳守）

**新機能・バグ修正の実装順序：**

1. **テスト作成**: 失敗するテストを先に書く（RED状態を確認）
2. **最小実装**: テストが通る最小限のコードを書く（GREEN状態）
3. **リファクタリング**: コードを改善（テストは通ったまま）
4. **コミット**: 意味のある単位でコミット

**禁止事項：**
- ❌ テストなしでの実装
- ❌ 実装後のテスト追加（後付けテスト）
- ❌ ブラウザ確認のみで完了（E2Eテストとして永続化すること）

### 仕様変更時のテスト更新

Issueで仕様変更があった場合:

```bash
# 1. 関連テストを検索
grep -r "関連キーワード" tests/

# 2. 期待値を新仕様に更新
# 3. Issueコメントに更新したテストを記録
```

---

## 6. PRワークフロー

1. PR作成後、`gh pr view <PR番号> --comments` でclaude-review結果を確認
2. 🔴 Critical Issues → **必ず修正**
3. 🟡 Moderate Issues → 可能な限り修正
4. 💡 Minor Suggestions → ユーザーに確認
5. **CI全チェック通過までマージしない**

---

## 7. ブランチ・コミット規約

**ブランチ命名:** `feature/{Epic番号}-us{US番号}-{機能名}`

**PRタイトル:** `[{ブランチ名}] {説明}` 例: `[001-us1-e2e] User Story 1 - E2Eテスト`

**コミット:** [Conventional Commits](https://www.conventionalcommits.org/)

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `test:` テスト
- `chore:` その他

**並列開発:**

- 依存のないUser Story同士は並列OK
- 1 PR = 1 User Story
- **tasks.md はfeatureブランチで更新しない**（コンフリクト防止、mainでマージ後に更新）

**main直接プッシュ禁止:**

- 全ての変更はブランチ → PR経由でマージ
- ドキュメント/ルール変更は `chore/docs-update` ブランチを使用
- リベースは未プッシュのローカルコミットのみ許可

---

## 8. コードコメント

- **ファイル冒頭**: 概要・依存関係
- **関数**: JSDoc形式（`@param`, `@returns`）
- **インライン**: 複雑なロジックのみ簡潔に

---

## 9. 禁止事項

- ユーザー許可なく `spec.md` を書き換えない
- 破壊的コマンド（`rm -rf` 等）は慎重に
- 機能フラグ・後方互換レイヤー・過剰な抽象化は作らない（YAGNI）

---

## 10. エラー対応

**同じエラーが2回連続したら:**

1. エラー分析結果を提示
2. 複数の修正方針を提案
3. ユーザーの判断を待つ

---

## 11. レスポンス形式

```typescript
{ success: boolean; message: string; code?: string; data?: T; }
```

---

## 12. プロジェクト概要

**ゆるぼ (YURUBO)**: 匿名型イベント調整プラットフォーム

| 層       | 技術                                           |
| -------- | ---------------------------------------------- |
| Frontend | Next.js 15 / TypeScript / Tailwind / shadcn-ui |
| Backend  | Supabase (DB + Auth)                           |
| Infra    | Vercel / Supabase Cloud                        |

---

## 13. 開発コマンド

```bash
npm run dev          # 開発サーバー
npm test             # Jestテスト
npm run test:e2e     # Playwrightテスト
npm run lint         # リント
npm run type-check   # 型チェック
npm run precheck     # push前の全チェック（lint + type-check + test + e2e）
```

---

## 14. フロントエンドデザインガイドライン

### 基本方針

**目標**: AIが生成する画一的なUIではなく、プロダクショングレードの独自性のあるインターフェースを構築する

**原則**:
- 美的ディテールとクリエイティブな選択に細心の注意を払う
- 実際に動作する、保守可能なコードを実装する
- YURUBOの「ゆるい雰囲気」と「機能性」を両立させる

### デザイン思考プロセス

実装前に以下を明確化する：

1. **目的**: このUIは何を解決するか？誰が使うか？
2. **トーン**: プロジェクトの性格に合った美的方向性を選ぶ
   - YURUBOの場合: 親しみやすさ、カジュアルさ、使いやすさ
3. **制約**: 技術要件（Next.js、Tailwind、shadcn-ui、パフォーマンス、アクセシビリティ）
4. **差別化**: このプロダクトを記憶に残すものは何か？
5. **実行**: 明確なコンセプトを一貫して実装する

### 技術スタック別ガイドライン

#### Tailwind CSS
- ユーティリティファーストで実装
- カスタムカラーは `tailwind.config.ts` で定義
- 繰り返しパターンは `@apply` でコンポーネント化せず、Reactコンポーネントで抽象化

#### shadcn-ui
- 基本コンポーネントとして活用
- カスタマイズは `components/ui/` で行う
- YURUBOの雰囲気に合わせたスタイル調整を積極的に実施

#### Next.js App Router
- Server Componentsを優先（インタラクティブな部分のみClient Components）
- 画像は `next/image` を使用し、最適化を徹底
- フォントは `next/font` で読み込み（Google Fonts推奨）

### 美的ガイドライン

#### タイポグラフィ
- **避けるべき**: Inter、Roboto、Arial、システムフォント
- **推奨**: Google Fontsから個性的で読みやすいフォントを選択
- ディスプレイ用と本文用で使い分け可能

```typescript
// 例: next/fontの使用
import { Plus_Jakarta_Sans } from 'next/font/google'
const font = Plus_Jakarta_Sans({ subsets: ['latin'] })
```

#### 色とテーマ
- CSS変数（Tailwindのテーマ変数）で一貫性を保つ
- アクセントカラーを効果的に使用
- YURUBOの場合: 温かみのある、親しみやすいカラーパレット

#### モーション
- CSS Transitionsを優先（`transition-all duration-300`など）
- 必要に応じて `framer-motion` を使用
- ページ読み込み時の段階的表示（staggered animation）
- ホバー状態、フォーカス状態のフィードバック

#### レイアウト
- 予測可能だが退屈にならないレイアウト
- 適度な余白（ネガティブスペース）の活用
- レスポンシブデザインの徹底

### 避けるべきパターン

- ❌ 汎用フォント（Inter、Roboto、Arial）
- ❌ ありふれた配色（白背景 + 紫グラデーション）
- ❌ 過度に複雑なアニメーション（パフォーマンス劣化）
- ❌ コンテキスト無視の型どおりデザイン

### 実装の複雑さとバランス

- **シンプルな機能**: シンプルで洗練されたUI
- **複雑な機能**: 必要に応じて視覚的なヒエラルキーを明確に
- コードの保守性とデザインの独自性を両立させる

### 実装チェックリスト

- [ ] アクセシビリティ（WAI-ARIA、キーボード操作）
- [ ] レスポンシブデザイン（モバイル、タブレット、デスクトップ）
- [ ] パフォーマンス（不要な再レンダリング回避）
- [ ] 一貫性（既存UIとの整合性）
- [ ] E2Eテスト（`data-testid` 属性の設定）

---

## 15. 参照ドキュメント

- [docs/firstspec.md](docs/firstspec.md) - 詳細仕様
- [docs/techplan.md](docs/techplan.md) - 技術仕様
