# SpecKit 使用ガイド

SpecKitは仕様駆動開発のためのコマンド群。新機能実装時に使用する。

---

## 前提条件

- **featureブランチでのみ実行可能**（mainでは実行不可）
- ワークツリー内で実行推奨
- 仕様フェーズをスキップしない

---

## ワークツリー作成フロー

```bash
# 1. Issueと紐付いたブランチを作成
gh issue develop <issue_number> --name feature/001-us1-xxx

# 2. ワークツリー作成（.env.localも自動コピーされる）
git gtr new <branch_name>

# 3. ワークツリーに移動
cd "$(git gtr go <branch_name>)"
```

---

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `/speckit.specify` | 自然言語から機能仕様を作成 |
| `/speckit.clarify` | 仕様の曖昧な部分を質問 |
| `/speckit.plan` | 設計成果物と実装計画を生成 |
| `/speckit.tasks` | 依存関係順のタスクリスト生成 |
| `/speckit.implement` | タスクを処理して実装 |
| `/speckit.analyze` | 成果物間の整合性分析 |
| `/speckit.checklist` | 機能固有チェックリスト生成 |

---

## 推奨ワークフロー

```
1. /speckit.specify   ← 仕様作成
2. /speckit.clarify   ← 曖昧点を解消
3. /speckit.plan      ← 設計・計画
4. /speckit.tasks     ← タスク分解
5. /speckit.implement ← 実装開始
6. /speckit.analyze   ← 整合性チェック
```

---

## 注意事項

- テンプレートは `.specify/templates/` を使用
- 各コマンドは前のステップの成果物を参照する
- `tasks.md` はfeatureブランチで更新しない（コンフリクト防止）
- mainマージ後に更新する

---

## 参照

- [constitution.md - SpecKitワークフロー](../../.specify/memory/constitution.md)
