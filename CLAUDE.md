# CLAUDE.md

Claude Code 向けプロジェクト設定ファイル

---

## プロジェクト概要

**ゆるぼ (YURUBO)**: 匿名型イベント調整プラットフォーム

| 層 | 技術 |
|----|------|
| Frontend | Next.js 15 / TypeScript / Tailwind / shadcn-ui |
| Backend | Supabase (DB + Auth) |
| Infra | Vercel / Supabase Cloud |

---

## 開発方針

- **言語**: すべて日本語（コード・コミット・ドキュメント）
- **手法**: テストファースト（フェーズに応じた戦略）
- **要件**: GitHub Issue が唯一の正解（SSOT）

---

## 核心ルール

1. **Issue確認してから実装**: `gh issue view <number>`
2. **テストファースト**: 初期フェーズはE2E優先、Unit Testは段階的に追加
3. **CI全チェック通過までマージしない**: `npm run precheck`
4. **main直接push禁止**: 必ずブランチ → PR経由
5. **食い違いはユーザーに確認**: 勝手に判断しない

---

## 基本コマンド

```bash
npm run dev          # 開発サーバー
npm run precheck     # push前の全チェック（必須）
gh issue view <n>    # Issue確認
git gtr new <branch> # ワークツリー作成
```

---

## ワークフロー

### 実装開始時
1. `gh issue view <number>` で要件確認
2. **作業タイプに応じた準備**（下記参照）
3. テストを作成（E2E優先、必要に応じてUnit）
4. テストが通る最小限の実装
5. リファクタリング

### 作業タイプ別の準備

| 作業タイプ | 実装前に読む | 確認ポイント |
|-----------|-------------|-------------|
| UI/コンポーネント | [constitution.md VIII](.specify/memory/constitution.md) | デザイン思考、Anti-Generic |
| テスト作成 | [constitution.md III](.specify/memory/constitution.md) | 現在フェーズの戦略 |
| ブランチ作成 | [constitution.md ブランチ戦略](.specify/memory/constitution.md) | 命名規則 |

### コミット・PR作成時
1. 重要な変更時は `code-reviewer` サブエージェントでセルフレビュー
2. `npm run precheck` 全チェック通過
3. PRに `Closes #<issue>` を含める
4. CI通過を確認してからマージ依頼

### セッション再開時
```bash
git branch --show-current
git status && git log --oneline -5
gh issue view <number>
```

### エラーが2回連続したら
1. エラー分析結果を提示
2. 複数の修正方針を提案
3. ユーザーの判断を待つ

---

## 完了の定義

- [ ] Issue要件を満たしている
- [ ] テスト（Unit/E2E）がパス
- [ ] `npm run precheck` がパス
- [ ] PR作成済み（`Closes #<issue>`）
- [ ] CI全チェック通過

---

## 禁止事項

- ユーザー許可なく `spec.md` を書き換えない
- 破壊的コマンド（`rm -rf` 等）は慎重に
- 過剰な抽象化は作らない（YAGNI）

---

## 参照ドキュメント

| 用途 | 参照先 |
|------|--------|
| SpecKit使用時 | [docs/agent/speckit.md](docs/agent/speckit.md) |
| Core Principles確認 | [constitution.md](.specify/memory/constitution.md) |
| 製品仕様の詳細 | [docs/firstspec.md](docs/firstspec.md) |
