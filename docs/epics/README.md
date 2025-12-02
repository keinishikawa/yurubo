# エピック管理 - YURUBO

## 概要

YURUBOプロジェクトの機能開発を「エピック」単位で管理します。各エピックは[firstspec.md](../firstspec.md)のフェーズ構造に基づいています。

---

## エピック一覧

### 基盤機能

| Epic | 名前 | ステータス | 優先度 | 依存 |
|------|------|------------|--------|------|
| [Epic 000](./epic-000-connections.md) | つながり管理 | Draft | P0 | なし |
| [Epic 001](./epic-001-event-creation.md) | イベント作成 | In Progress | P1 | Epic 000 |

### コア機能（Phase順）

| Epic | 名前 | ステータス | 優先度 | 依存 |
|------|------|------------|--------|------|
| Epic 002 | 参加・承認 | Planned | P2 | Epic 001 |
| Epic 003 | 店選定 | Planned | P3 | Epic 002 |
| Epic 004 | チャット | Planned | P3 | Epic 002 |
| Epic 005 | 精算 | Planned | P4 | Epic 004 |
| Epic 006 | アーカイブ | Planned | P5 | Epic 005 |

### 特殊機能

| Epic | 名前 | ステータス | 優先度 | 依存 |
|------|------|------------|--------|------|
| Epic 007 | マジックインビテーション | Planned | P1 | Epic 000, 001 |

### 横断機能

| Epic | 名前 | ステータス | 優先度 | 依存 |
|------|------|------------|--------|------|
| Epic 008 | 通知システム | Planned | P2 | Epic 002 |
| Epic 009 | 匿名化システム | Planned | P2 | Epic 001 |

---

## 依存関係図

```
Epic 000: つながり管理 (基盤)
  ↓
  ├─→ Epic 001: イベント作成
  │     ↓
  │     └─→ Epic 002: 参加・承認
  │           ↓
  │           ├─→ Epic 003: 店選定
  │           ├─→ Epic 004: チャット
  │           │     ↓
  │           │     └─→ Epic 005: 精算
  │           │           ↓
  │           │           └─→ Epic 006: アーカイブ
  │           │
  │           └─→ Epic 008: 通知システム
  │
  └─→ Epic 007: マジックインビテーション (Epic 001にも依存)

Epic 009: 匿名化システム (Epic 001以降に適用)
```

---

## エピックのステータス定義

| ステータス | 説明 |
|------------|------|
| **Draft** | 仕様策定中 |
| **Planned** | 仕様確定済み、実装待ち |
| **In Progress** | 実装中 |
| **Completed** | 実装完了・本番リリース済み |
| **On Hold** | 一時保留 |

---

## 優先度定義

| 優先度 | 説明 |
|--------|------|
| **P0** | 最優先・基盤機能（他の全機能が依存） |
| **P1** | 高優先度・MVP必須機能 |
| **P2** | 中優先度・早期リリース推奨 |
| **P3** | 通常優先度 |
| **P4** | 低優先度 |
| **P5** | 最低優先度 |

---

## エピック作成ガイドライン

各エピックmdには以下を含める：

### 必須セクション
1. **概要**
   - 目的
   - ユーザー価値
   - 依存関係

2. **User Stories**
   - As a [役割], I want to [行動], So that [価値]
   - Acceptance Criteria（AC）

3. **技術仕様**
   - DBテーブル設計
   - API設計
   - UI設計
   - RLS（Row-Level Security）

4. **E2Eテスト戦略**
   - 主要シナリオ
   - テストケース例

5. **完了の定義（DoD）**

6. **関連エピック**

---

## GitHub Issue連携

### ラベル規約
- `epic:000-connections`
- `epic:001-event-creation`
- `epic:002-participation`
- ...

### Issue命名規約
```
[Epic XXX - USY] 機能名
```
例: `[Epic 000 - US1] つながりの追加機能`

### Milestone
エピック単位でMilestone作成を推奨

---

## 並列開発ルール

- 依存関係のないエピック同士は並列開発OK
- 例: Epic 003（店選定）とEpic 004（チャット）は並列可能
- 1 PR = 1 User Story を推奨
- **tasks.md はmainでのみ更新**（コンフリクト防止）

---

## 参考資料

- [firstspec.md](../firstspec.md) - 詳細仕様
- [techplan.md](../techplan.md) - 技術仕様
- [CLAUDE.md](../../CLAUDE.md) - 開発ルール

---

**最終更新**: 2025-12-02
**管理者**: Product Team
