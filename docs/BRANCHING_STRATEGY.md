# Git ブランチ戦略

YURUBOプロジェクトは**Trunk-Based Development**を採用します。

## 基本原則

1. **main は常に動作可能でデプロイ可能な状態を保つ**
2. **feature ブランチは小さい単位で作業し、早くマージする**
3. **長期間のブランチは避ける（2〜3日以内にマージ）**

## ブランチの種類

### `main`
- **用途**: プロダクションリリース可能なコード
- **保護**: 直接pushは禁止（必ずPRを経由）
- **マージ条件**:
  - すべてのテストがパス
  - コードレビュー完了
  - CIビルド成功

### `feature/*`
- **用途**: 新機能開発（User Story単位）
- **命名規則**: `feature/[3桁機能番号]-[feature-name]`
- **例**:
  - `feature/001-event-creation` (User Story 1: イベント作成機能)
  - `feature/002-timeline-view` (User Story 2: タイムライン閲覧)
  - `feature/003-event-edit` (User Story 3: イベント編集)
- **Phase用ブランチ**: `feature/000-[phase-name]`
  - `feature/000-phase2-foundation` (Phase 2: 基盤構築)
- **ライフサイクル**:
  1. mainからブランチを切る
  2. User Story単位で作業（specs/001-event-creation/に対応）
  3. 頻繁にmainからrebaseして最新状態を保つ
  4. 完了したらPRを作成してmainにマージ
  5. マージ後すぐに削除

### `fix/*`
- **用途**: バグ修正
- **命名規則**: `fix/[issue-number]-[brief-description]`
- **例**:
  - `fix/123-event-card-layout`
  - `fix/timeline-infinite-scroll`
- **ライフサイクル**: feature/*と同じ

## ワークフロー

### 1. 新しい作業を始める

```bash
# mainを最新状態にする
git checkout main
git pull origin main

# 新しいfeatureブランチを作成（User Story単位）
git checkout -b feature/001-event-creation

# Phase用のブランチを作成する場合
git checkout -b feature/000-phase2-foundation
```

### 2. 作業中

```bash
# 頻繁にコミット
git add .
git commit -m "feat: Next.jsプロジェクトの初期設定"

# 定期的にmainからrebase（他の人の変更を取り込む）
git fetch origin
git rebase origin/main
```

### 3. 完了時

```bash
# 最終的にmainからrebase
git fetch origin
git rebase origin/main

# リモートにpush
git push origin feature/001-event-creation

# GitHubでPRを作成
# - タイトル: [001] イベント作成機能の実装
# - 説明: 何を実装したか、テスト状況、スクリーンショット等
```

### 4. マージ後

```bash
# mainに戻る
git checkout main
git pull origin main

# 作業済みブランチを削除
git branch -d feature/001-event-creation
```

## コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/)に従います。

### フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type一覧

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの動作に影響しない変更（フォーマット、セミコロン等）
- **refactor**: バグ修正や機能追加ではないコード変更
- **test**: テストの追加・修正
- **chore**: ビルドプロセスやツールの変更

### 例

```bash
# 新機能
git commit -m "feat(events): イベント投稿モーダルの実装"

# バグ修正
git commit -m "fix(timeline): 無限スクロールが動作しない問題を修正"

# テスト追加
git commit -m "test(validation): イベントバリデーションの単体テストを追加"

# リファクタリング
git commit -m "refactor(api): イベント作成APIのエラーハンドリングを改善"
```

## Pull Request ガイドライン

### PRタイトル

```
[機能番号] 簡潔な説明
```

例:
- `[001] イベント作成機能の実装 (Phase 3完了)`
- `[002] タイムライン閲覧機能の実装`
- `[000] Phase 2基盤構築完了`

### PR説明テンプレート

```markdown
## 概要
[何を実装したか]

## User Story
[関連するUser Story（P1/P2/P3）]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] 単体テスト: すべてパス
- [ ] 統合テスト: すべてパス
- [ ] E2Eテスト: 該当シナリオパス
- [ ] 手動テスト完了

## スクリーンショット（UI変更の場合）
[スクリーンショットまたはGIF]

## チェックリスト
- [ ] TypeScript型エラーなし
- [ ] リントエラーなし
- [ ] テストがすべてパス
- [ ] ドキュメント更新済み（必要な場合）
```

## ベストプラクティス

### ✅ 推奨

- **機能単位のPR**: 1PR = 1 User Story または 1 Phase
- **頻繁なコミット**: 作業の論理的な区切りでコミット
- **こまめなrebase**: mainの変更を定期的に取り込む
- **self-review**: PRを出す前に自分でコードを見直す
- **テストファースト**: テストを先に書いてからコード実装
- **tasks.mdの更新**: タスク完了時は必ず`[X]`でマーク

### ❌ 避けるべき

- **長期間のブランチ**: 3日以上マージしない
- **大きすぎるPR**: 500行以上の変更
- **WIPの長期化**: 作業中ブランチの放置
- **force push**: 既にpushしたコミットの書き換え（mainから最新をrebaseする場合は例外）
- **mainへの直接push**: 必ずPRを経由

## トラブルシューティング

### コンフリクトが発生した場合

```bash
# mainからrebase中にコンフリクト
git rebase origin/main

# エディタでコンフリクトを解決
# <<<<<<< HEAD と ======= と >>>>>>> を削除

# 解決後
git add .
git rebase --continue
```

### 間違ってコミットした場合

```bash
# 最後のコミットを取り消す（変更は残る）
git reset HEAD~1

# コミットメッセージだけ修正
git commit --amend
```

### mainから最新を取り込む

```bash
# rebase方式（推奨）
git fetch origin
git rebase origin/main

# merge方式（コンフリクトが多い場合）
git fetch origin
git merge origin/main
```

## 参考資料

- [Trunk Based Development](https://trunkbaseddevelopment.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
