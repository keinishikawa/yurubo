# Implementation Plan: つながり管理（Connections）

**Branch**: `000-connections` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/000-connections/spec.md`

## Summary

ユーザー間の関係性を「アクティビティ単位」で管理し、イベント配信範囲を適切に制御する基盤機能を実装する。既存のconnectionsテーブルを活用しつつ、つながりリクエスト管理用の新規テーブルと通知機能を追加する。

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 15 (App Router)
**Primary Dependencies**: Supabase (Auth + Database), Zod, shadcn-ui, Tailwind CSS
**Storage**: PostgreSQL (Supabase)
**Testing**: Jest + React Testing Library (Unit), Playwright (E2E)
**Target Platform**: Web (モバイルファースト)
**Project Type**: Web application
**Performance Goals**: つながりリスト表示1秒以内（100件以下）
**Constraints**: 認証必須、RLSによるアクセス制御
**Scale/Scope**: 初期段階はつながり数上限なし（パフォーマンス監視）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 状態 | 備考 |
|------|------|------|
| I. ストーリー駆動開発 | ✅ PASS | 5つのUser Storyで構成、優先度付け済み |
| II. シンプルさ優先（YAGNI） | ✅ PASS | 最小構成で実装、将来拡張は明示的に延期 |
| III. テストファースト | ✅ PASS | TDDサイクルで実装、E2E優先 |
| IV. 型安全性とバリデーション | ✅ PASS | Zodスキーマ定義済み |
| V. 統一されたエラーハンドリング | ✅ PASS | 標準レスポンス形式使用 |
| VI. AI補助の原則 | N/A | 本機能では該当なし |
| VII. 学習補助モード | ✅ PASS | 日本語コメント必須 |

## Project Structure

### Documentation (this feature)

```text
specs/000-connections/
├── spec.md              # 機能仕様
├── plan.md              # このファイル
├── research.md          # Phase 0: 技術調査結果
├── data-model.md        # Phase 1: データモデル定義
├── quickstart.md        # Phase 1: クイックスタートガイド
├── contracts/
│   └── api.md           # Phase 1: API契約
└── tasks.md             # Phase 2: タスクリスト（/speckit.tasks で生成）
```

### Source Code (repository root)

```text
app/
├── actions/
│   ├── connections/           # つながり関連Server Actions
│   │   ├── search-users.ts
│   │   ├── send-request.ts
│   │   ├── get-requests.ts
│   │   ├── accept-request.ts
│   │   ├── reject-request.ts
│   │   ├── get-connections.ts
│   │   ├── update-categories.ts
│   │   └── delete-connection.ts
│   └── notifications/         # 通知関連Server Actions
│       ├── get-notifications.ts
│       └── mark-as-read.ts
├── (auth)/
│   └── connections/           # つながり管理ページ
│       ├── page.tsx           # つながりリスト
│       ├── requests/
│       │   └── page.tsx       # リクエスト一覧
│       └── search/
│           └── page.tsx       # ユーザー検索

components/
└── connections/               # つながり関連コンポーネント
    ├── connection-list.tsx
    ├── connection-card.tsx
    ├── request-list.tsx
    ├── request-card.tsx
    ├── user-search.tsx
    ├── category-editor.tsx
    └── notification-badge.tsx

lib/
├── services/
│   └── connection.service.ts  # 既存ファイル拡張
└── validation/
    └── connections.ts         # Zodスキーマ

supabase/
└── migrations/
    ├── 20251203000001_create_connection_requests_table.sql
    └── 20251203000002_create_notifications_table.sql

tests/
├── unit/
│   └── connections/
└── e2e/
    └── connections/
```

**Structure Decision**: 既存のNext.js App Router構造に従い、Server Actions + Supabase RLSで実装

## Complexity Tracking

> 憲法違反がないため、複雑性の正当化は不要

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| なし | - | - |

## Implementation Phases

### Phase 1: データベース拡張（P1）

1. connection_requestsテーブル作成
2. notificationsテーブル作成
3. RLSポリシー設定
4. 型定義の再生成

### Phase 2: Server Actions実装（P1）

1. ユーザー検索（searchUsers）
2. リクエスト送信（sendConnectionRequest）
3. リクエスト承認/拒否（accept/rejectConnectionRequest）
4. リクエスト一覧取得（getReceivedRequests）

### Phase 3: UIコンポーネント実装（P1）

1. ユーザー検索画面（/connections/search）
2. リクエスト一覧画面（/connections/requests）
3. 検索結果の「友人」ラベル表示

### Phase 4: つながりリスト管理（P2）

1. つながりリスト画面（/connections）
2. カテゴリ設定エディター
3. つながり削除機能
4. フィルタ・検索機能

### Phase 5: 通知機能（P2）

1. 通知一覧取得
2. 既読更新
3. 通知バッジ表示

### Phase 6: イベント配信連携（P3）

1. Epic 001との連携実装
2. 双方向カテゴリチェックロジック

## References

- [spec.md](./spec.md) - 機能仕様
- [research.md](./research.md) - 技術調査結果
- [data-model.md](./data-model.md) - データモデル
- [contracts/api.md](./contracts/api.md) - API契約
- [quickstart.md](./quickstart.md) - クイックスタート
- [constitution.md](../../.specify/memory/constitution.md) - プロジェクト憲法
