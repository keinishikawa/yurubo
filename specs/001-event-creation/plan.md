# Implementation Plan: フェーズ1：イベント投稿機能

**Branch**: `001-event-creation` | **Date**: 2025-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-event-creation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

フェーズ1では、YURUBOの核心価値「誘う摩擦をゼロにする」を実現するため、匿名イベント投稿機能とタイムライン表示機能を実装します。

**主要機能**:
- **匿名イベント投稿（P1）**: つながりリスト内の該当カテゴリOKユーザーのみに配信される匿名投稿機能
- **タイムライン閲覧（P2）**: つながりベースでフィルタリングされたイベント一覧表示
- **イベント編集（P3）**: 参加者承認前のみ編集可能

**技術アプローチ**:
- Next.js 15 App Router + React Server Components
- Supabase（PostgreSQL 15）でRow-Level Securityによるアクセス制御
- Zodスキーマでフロント/バックエンド共通バリデーション
- TDDワークフロー（単体→統合→E2E）に基づくテストファースト開発

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 15 (App Router)
**Primary Dependencies**: React 19, Supabase Client, Zod, React Hook Form, shadcn-ui, TailwindCSS
**Storage**: Supabase (PostgreSQL 15) with Row-Level Security
**Testing**: Jest (単体・統合), Playwright (E2E)
**Target Platform**: Web (モバイルファースト、レスポンシブ対応)
**Project Type**: Web application (Next.js App Router - フロント/バックエンド統合型)
**Performance Goals**:
  - タイムライン初回表示: LCP 2.5s以下
  - 投稿完了→タイムライン反映: 1秒以内
  - 無限スクロール追加読み込み: 500ms以内
**Constraints**:
  - TypeScript strict mode必須
  - 匿名性保証（投稿者実名を100%非表示）
  - つながりリストベース配信（範囲外ユーザーへの漏洩ゼロ）
  - 1日あたりカテゴリ別投稿上限3件
**Scale/Scope**:
  - 初期想定ユーザー数: 100〜1000人
  - タイムライン表示件数: 50件まで遅延なし表示
  - User Story: 3つ（P1〜P3）
  - 主要画面: 3画面（タイムライン、投稿モーダル、マイイベント）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: ストーリー駆動開発
- ✅ **Pass**: spec.mdに3つのUser Story（P1〜P3）が定義され、各ストーリーに受入シナリオ・優先度・独立テスト可能性が明記
- ✅ **Pass**: 各ストーリーはGiven-When-Then形式で記述され、独立実装可能

### Principle II: シンプルさ優先（YAGNI）
- ✅ **Pass**: 未リリース段階のため機能フラグ・後方互換レイヤーは作成しない
- ✅ **Pass**: 最小構成（匿名投稿→タイムライン表示→編集）のみ実装
- ⚠️ **要注意**: つながりリストのcategory_flags（JSONB）は将来拡張を見越した設計の可能性あり
  - **判断**: カテゴリ単位の権限制御は現在の要件（FR-008）に必須。過剰設計ではない

### Principle III: テストファースト
- ✅ **Pass**: Bottom-Up TDD Workflowに従う（Phase 2: 単体テスト → Phase 3: 統合テスト → Phase 4: E2Eテスト）
- ✅ **Pass**: spec.mdの受入シナリオ（7+5+4=16シナリオ）をE2Eテストで全カバー予定

### Principle IV: 型安全性とバリデーション
- ✅ **Pass**: TypeScript strict mode使用
- ✅ **Pass**: Zodでバリデーションスキーマを定義予定（FR-015のバリデーションルール）
- ✅ **Pass**: フロントエンド（React Hook Form + Zod）とバックエンド（API + Zod）でスキーマ再利用

### Principle V: 統一されたエラーハンドリング
- ✅ **Pass**: すべてのAPIレスポンスは`{success, message, code}`形式（FR-016, FR-017）
- ✅ **Pass**: エラーメッセージは日本語で明確に記述（spec.md Edge Casesに記載）

### Principle VI: AI補助の原則
- ✅ **Pass**: フェーズ1にはAI機能なし（店舗レコメンド等はフェーズ3以降）

### Principle VII: 学習補助モード
- ✅ **Pass**: タスク実装時に`.learning/tasks/`へ実装ガイド出力予定

**GATE判定: PASS** - 全原則に準拠。Phase 0 researchへ進行可能。

---

### Constitution Check (再評価 - Phase 1完了後)

Phase 1設計完了後の再評価:

#### Principle I: ストーリー駆動開発
- ✅ **Pass**: data-model.mdとcontracts/api.yamlが3つのUser Story（P1〜P3）に完全対応
- ✅ **Pass**: 各APIエンドポイントが受入シナリオに直接マッピング

#### Principle II: シンプルさ優先（YAGNI）
- ✅ **Pass**: データモデルは最小構成（4テーブル）
- ✅ **Pass**: APIエンドポイントは5つのみ（CRUD + Cancel）
- ✅ **Pass**: 複雑な抽象化なし（直接的なSupabase RLS使用）

#### Principle III: テストファースト
- ✅ **Pass**: quickstart.mdにテスト実行手順が明記
- ✅ **Pass**: 各テストレベル（単体/統合/E2E）のディレクトリ構造確定
- ✅ **Pass**: contracts/api.yamlでテストケース生成可能

#### Principle IV: 型安全性とバリデーション
- ✅ **Pass**: data-model.mdでPostgreSQLスキーマ定義
- ✅ **Pass**: contracts/api.yamlで型定義とバリデーションルール明記
- ✅ **Pass**: Zodスキーマ再利用パターン確立（research.md参照）

#### Principle V: 統一されたエラーハンドリング
- ✅ **Pass**: contracts/api.yamlで`{success, message, code}`形式を統一
- ✅ **Pass**: 全エラーコード一覧定義済み（ERR_VALIDATION, ERR_NOT_FOUND等）

#### Principle VI: AI補助の原則
- ✅ **Pass**: フェーズ1にAI機能なし（該当なし）

#### Principle VII: 学習補助モード
- ✅ **Pass**: quickstart.mdで段階的セットアップ手順を提供
- ✅ **Pass**: .learning/tasks/ディレクトリ構造確定

**再評価結果: PASS** - Phase 1設計は全原則に準拠。Phase 2（タスク生成）へ進行可能。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/                              # Next.js 15 App Router
├── (auth)/                       # 認証グループルート（将来実装）
├── api/                          # API Routes
│   └── events/                   # イベント関連API
│       ├── route.ts              # POST /api/events（イベント投稿）
│       ├── route.test.ts         # 統合テスト
│       └── [id]/
│           ├── route.ts          # GET/PATCH /api/events/[id]
│           └── route.test.ts
├── page.tsx                      # タイムライン（ホーム画面）
├── my/                           # マイイベント画面
│   └── page.tsx
└── layout.tsx                    # ルートレイアウト

components/                       # 共通UIコンポーネント
├── ui/                           # shadcn-ui基本コンポーネント
│   ├── button.tsx
│   ├── modal.tsx
│   ├── input.tsx
│   └── ...
├── events/                       # イベント関連コンポーネント
│   ├── EventCard.tsx             # イベントカード
│   ├── EventCard.test.tsx        # 単体テスト
│   ├── PostEventModal.tsx        # 投稿モーダル
│   ├── PostEventModal.test.tsx
│   ├── EventTimeline.tsx         # タイムライン
│   └── EventTimeline.test.tsx
└── layout/
    └── FloatingPostButton.tsx    # 右下「＋投稿」ボタン

lib/                              # ビジネスロジック・ユーティリティ
├── supabase/
│   ├── client.ts                 # Supabaseクライアント
│   └── types.ts                  # 自動生成型定義
├── validation/
│   ├── event.schema.ts           # Zodスキーマ
│   └── event.schema.test.ts      # バリデーションテスト
├── services/
│   ├── event.service.ts          # イベントビジネスロジック
│   └── event.service.test.ts
└── utils/
    ├── anonymousId.ts            # 匿名ID生成ロジック
    └── anonymousId.test.ts

tests/
└── e2e/                          # E2Eテスト（Playwright）
    ├── user-story-1.spec.ts      # P1: 匿名イベント投稿
    ├── user-story-2.spec.ts      # P2: タイムライン閲覧
    └── user-story-3.spec.ts      # P3: イベント編集

supabase/                         # Supabaseプロジェクト設定
├── migrations/                   # マイグレーションファイル
│   └── 20251111_create_events.sql
└── seed.sql                      # テストデータ

.learning/
└── tasks/                        # 学習用タスクガイド
    ├── T001-setup-project.md
    ├── T002-event-validation.md
    └── ...
```

**Structure Decision**: Next.js App Routerの統合型構造を採用。

**理由**:
- フロントエンドとバックエンドが同一プロジェクト内に統合
- `app/api/`でAPIルートを定義し、Server Actionsも活用可能
- コロケーション原則に従い、コンポーネントとテストを同じディレクトリに配置
- Supabaseマイグレーションは`supabase/`ディレクトリで管理

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
