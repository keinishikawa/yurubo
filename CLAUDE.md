# CLAUDE.md

Claude Code 向けプロジェクト設定ファイル

---

## 1. 基本設定

- **言語**: すべて日本語（コード・コミット・ドキュメント）
- **役割**: Next.js (App Router), Supabase, TypeScript エキスパート

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

# ワークツリー作成
git gtr add <branch_name>
```

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

## 5. テスト戦略

### テスト種別と実行タイミング

| 種別 | 対象 | 実行タイミング |
|------|------|----------------|
| Unit (Jest) | ビジネスロジック、ユーティリティ | 実装中・push前 |
| E2E (Playwright) | User Story全体の動作 | push前（必須） |
| 目視確認 | レイアウト崩れ、アニメーション | 実装中のみ |

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

### E2E義務

ブラウザ確認で終わらず、**Playwrightテストとして永続化**すること

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

| 層 | 技術 |
|----|------|
| Frontend | Next.js 15 / TypeScript / Tailwind / shadcn-ui |
| Backend | Supabase (DB + Auth) |
| Infra | Vercel / Supabase Cloud |

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

## 14. 参照ドキュメント

- [docs/firstspec.md](docs/firstspec.md) - 詳細仕様
- [docs/techplan.md](docs/techplan.md) - 技術仕様
