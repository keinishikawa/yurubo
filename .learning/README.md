# Learning ディレクトリ

このディレクトリは、プロジェクトの学習補助を目的とした詳細な実装ガイドを提供します。

## ディレクトリ構造

```
.learning/
├── tasks/           # タスク単位の実装ガイド
│   └── 001-event-creation/
│       ├── T001-create-nextjs-project.md
│       ├── T042-implement-event-service.md
│       └── ...
├── guides/          # 横断的な学習ガイド
│   ├── typescript-basics.md
│   ├── next-app-router.md
│   ├── supabase-rls.md
│   └── ...
└── references/     # アーキテクチャ参照
    ├── architecture-overview.md
    └── testing-strategy.md
```

## 目的

### tasks/
タスク単位（T001, T002, ...）の詳細な実装ガイドを提供

**記載内容**:
- 実装概要（spec.mdからの抜粋）
- 技術解説（使用技術、文法・パターン解説）
- 実装手順（ステップバイステップ）
- コード例（Bad/Good比較）
- テストケース
- トラブルシューティング

### guides/
横断的な技術ガイド（TypeScript基礎、Next.js App Router、Supabase RLSなど）

**対象**:
- プロジェクト全体で使用する技術スタック
- 複数タスクで共通する実装パターン
- ベストプラクティス

### references/
プロジェクト全体のアーキテクチャ参照ドキュメント

**記載内容**:
- アーキテクチャ概要
- データモデル全体像
- テスト戦略
- CI/CDフロー

## 使い方

### 1. コード内コメントから参照

```typescript
/**
 * ファイル名: event.service.ts
 *
 * 【概要】
 * イベント作成・取得のビジネスロジック
 *
 * @see .learning/tasks/001-event-creation/T042-implement-event-service.md
 */
```

`@see` タグで該当する学習ガイドへのリンクを提供

### 2. 直接参照

Epic/User Story単位で実装内容を学習したい場合:
```bash
# Epic 001（イベント作成機能）の全タスクガイドを確認
ls .learning/tasks/001-event-creation/
```

### 3. 横断的な学習

特定技術を深く学びたい場合:
```bash
# TypeScript基礎を学ぶ
cat .learning/guides/typescript-basics.md
```

## 作成タイミング

### Phase 3（User Story 3以降）:
- タスク実装時に手動作成
- 実装完了後、`.learning/tasks/{epic}/{task_id}.md` を追加

### Phase 4（Epic 002以降）:
- `/speckit.implement` による自動生成
- タスク完了時に自動で学習ガイド生成

## テンプレート

タスク実装ガイドのテンプレートは以下を参照:
- `.specify/templates/learning-task-template.md`

## コントリビューション

### 新しいガイドの追加

1. `guides/` または `references/` に新しいMarkdownファイルを作成
2. テンプレートに従って内容を記載
3. README.mdにリンクを追加（オプション）

### 既存ガイドの更新

- 実装が変更された場合、対応する学習ガイドも更新
- 古い情報は削除または「非推奨」マークを追加

## 関連ドキュメント

- [CLAUDE.md](../CLAUDE.md) - 学習補助システムの全体方針
- [specs/](../specs/) - Epic/User Story仕様書
- [.specify/templates/](../.specify/templates/) - SpecKitテンプレート
