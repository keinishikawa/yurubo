# Tasks: フェーズ1：イベント作成機能

**Feature Branch**: `001-event-creation`
**Created**: 2025-11-11
**Status**: Draft

**Input**: Design documents from `/specs/001-event-creation/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.yaml, research.md, quickstart.md

**Tests**: TDD必須 - すべての実装コードには対応するテスト（単体・統合・E2E）が必須

**Organization**: タスクはUser Story単位で整理され、各ストーリーは独立して実装・テスト可能

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並行実行可能（異なるファイル、依存関係なし）
- **[Story]**: User Storyラベル（US1, US2, US3）
- 説明には必ず具体的なファイルパスを含める

---

## Phase 1: Setup（プロジェクト初期化）

**目的**: プロジェクトの基本構造とツール設定

- [x] T001 Create Next.js 15 project structure with TypeScript and App Router
- [x] T002 Install core dependencies (React 19, Supabase Client, Zod, React Hook Form, shadcn-ui, TailwindCSS)
- [x] T003 [P] Configure TypeScript strict mode in tsconfig.json
- [x] T004 [P] Configure ESLint and Prettier
- [x] T005 [P] Setup environment variables template in .env.example
- [x] T006 [P] Initialize Supabase CLI and link to project
- [x] T007 [P] Configure Jest for unit and integration tests in jest.config.js
- [x] T008 [P] Configure Playwright for E2E tests in playwright.config.ts
- [x] T009 Create project directory structure (app/, components/, lib/, tests/, supabase/)

---

## Phase 2: Foundational（基盤構築）

**目的**: すべてのUser Storyの前提となる基盤実装

**⚠️ CRITICAL**: このフェーズ完了前にUser Story実装は開始できない

### データベースマイグレーション

- [x] T010 Create categories table migration in supabase/migrations/20251111000001_create_categories_table.sql
- [x] T011 Create users table migration in supabase/migrations/20251111000002_create_users_table.sql
- [x] T012 Create events table migration in supabase/migrations/20251111000003_create_events_table.sql
- [x] T013 Create connections table migration in supabase/migrations/20251111000004_create_connections_table.sql
- [x] T014 Create RLS policies for all tables in supabase/migrations/20251111000005_enable_rls_policies.sql
- [x] T015 Create triggers and functions (updated_at, daily post limit check) in supabase/migrations/20251111000006_create_triggers_and_functions.sql
- [x] T016 Create test seed data in supabase/seed.sql
- [x] T017 Run migrations and verify database setup with Supabase CLI

### Supabaseクライアント設定

- [x] T018 [P] Create Supabase client for Server Components in lib/supabase/server.ts
- [x] T019 [P] Create Supabase client for Client Components in lib/supabase/client.ts
- [x] T020 [P] Generate TypeScript types from database schema in lib/supabase/types.ts

### Zodバリデーションスキーマ

- [x] T021 [P] Create event validation schema with Zod in lib/validation/event.schema.ts
- [x] T022 [P] Write unit tests for event validation schema in lib/validation/event.schema.test.ts
- [x] T023 [P] Create connection validation schema in lib/validation/connection.schema.ts
- [x] T024 [P] Create user validation schema in lib/validation/user.schema.ts

### ユーティリティ関数

- [x] T025 [P] Implement anonymous ID generation logic in lib/utils/generateAnonId.ts
- [x] T026 [P] Write unit tests for anonymous ID generation in lib/utils/generateAnonId.test.ts
- [x] T027 [P] Create error handling utility in lib/utils/errors.ts
- [x] T028 [P] Create date/time formatting utility in lib/utils/dateFormatter.ts

### shadcn-ui基本コンポーネント

- [x] T029 [P] Setup shadcn-ui and add Button component to components/ui/button.tsx
- [x] T030 [P] Add Modal component to components/ui/modal.tsx
- [x] T031 [P] Add Input component to components/ui/input.tsx
- [x] T032 [P] Add Select component to components/ui/select.tsx
- [x] T033 [P] Add Textarea component to components/ui/textarea.tsx
- [x] T034 [P] Add Slider component to components/ui/slider.tsx
- [x] T035 [P] Add Toast notification component to components/ui/toast.tsx

### レイアウト・共通UI

- [x] T036 [P] Create root layout with navigation in app/layout.tsx
- [x] T037 [P] Create error boundary in app/error.tsx
- [x] T038 [P] Create loading state component in app/loading.tsx

**Checkpoint**: 基盤完了 - User Story実装を並行開始可能

---

## Phase 3: User Story 1 - 匿名イベント投稿（つながりリスト配信） (Priority: P1) 🎯 MVP

**Goal**: ユーザーが心理的抵抗なく「軽く誘う」ためのイベント投稿を行い、つながりリスト内の該当カテゴリOKユーザーのみに配信される

**Independent Test**: ログイン後、投稿モーダルから基本情報を入力し、投稿完了後にタイムラインに匿名投稿として表示され、つながりリスト内の該当カテゴリOKユーザーのみに配信されることを確認

**Acceptance Scenarios**: 7シナリオ（spec.md参照）

### Unit Tests for User Story 1（TDD Phase 2）

> **NOTE: 実装前にテストを作成し、REDになることを確認**

- [x] T039 [P] [US1] Write unit test for event creation validation in lib/services/event.service.test.ts
- [x] T040 [P] [US1] Write unit test for daily post limit check in lib/services/event.service.test.ts
- [x] T041 [P] [US1] Write unit test for anonymous ID assignment in lib/services/event.service.test.ts

### Implementation for User Story 1（TDD Phase 3）

#### ビジネスロジック・サービス層

- [x] T042 [US1] Implement event creation service in lib/services/event.service.ts
- [x] T043 [US1] Implement daily post limit check logic in event service
- [x] T044 [US1] Implement anonymous ID assignment logic in event service

#### Server Actions

- [x] T045 [US1] Create event creation Server Action in app/actions/createEvent.ts
- [x] T046 [US1] Write integration test for event creation API in app/actions/createEvent.test.ts

#### UIコンポーネント

- [x] T047 [P] [US1] Create EventCard component in components/events/EventCard.tsx
- [x] T048 [P] [US1] Write unit test for EventCard component in components/events/EventCard.test.tsx
- [x] T049 [US1] Create PostEventModal component with category selection in components/events/PostEventModal.tsx
- [x] T050 [US1] Add date/time picker to PostEventModal (開催日時: 開始・終了)
- [x] T051 [US1] Add capacity range input to PostEventModal (想定人数: 最小・最大)
- [x] T052 [US1] Add price range slider to PostEventModal (価格帯: 3000~5000円デフォルト)
- [x] T053 [US1] Add comment textarea to PostEventModal
- [x] T054 [US1] Integrate React Hook Form with Zod validation in PostEventModal
- [x] T055 [US1] Add error message display to PostEventModal
- [x] T056 [US1] Write unit test for PostEventModal in components/events/PostEventModal.test.tsx
- [x] T057 [P] [US1] Create FloatingPostButton component (右下「＋投稿」ボタン) in components/layout/FloatingPostButton.tsx

#### 統合

- [x] T058 [US1] Integrate PostEventModal with createEvent Server Action
- [x] T059 [US1] Add toast notification on successful event creation
- [x] T060 [US1] Add loading state during event creation

### E2E Tests for User Story 1（TDD Phase 4）

> **IMPORTANT: spec.mdの受入シナリオ7つすべてをテストケース化**

- [ ] T061 [US1] E2E test: 投稿モーダル表示（シナリオ1） in tests/e2e/user-story-1.spec.ts
- [ ] T062 [US1] E2E test: イベント投稿完了（シナリオ2） in tests/e2e/user-story-1.spec.ts
- [ ] T063 [US1] E2E test: 匿名ID表示（シナリオ3） in tests/e2e/user-story-1.spec.ts
- [ ] T064 [US1] E2E test: つながりリストOKユーザーに表示（シナリオ4） in tests/e2e/user-story-1.spec.ts
- [ ] T065 [US1] E2E test: つながりリストNGユーザーに非表示（シナリオ5） in tests/e2e/user-story-1.spec.ts
- [ ] T066 [US1] E2E test: 1日3件投稿上限エラー（シナリオ6） in tests/e2e/user-story-1.spec.ts
- [ ] T067 [US1] E2E test: 必須項目未入力エラー（シナリオ7） in tests/e2e/user-story-1.spec.ts

### Edge Cases for User Story 1

- [x] T068 [US1] Add validation for past date_start in event.schema.ts
- [x] T069 [US1] Add validation for date_end before date_start in event.schema.ts
- [x] T070 [US1] Add validation for capacity_min > capacity_max in event.schema.ts
- [x] T071 [US1] Add validation for deadline after date_start in event.schema.ts
- [x] T072 [US1] Handle network error with retry logic and user-friendly message
- [x] T073 [US1] Add warning message for empty connections list

**Checkpoint**: User Story 1が完全に機能し、独立してテスト可能

---

## Phase 4: User Story 2 - タイムライン閲覧（つながりベース） (Priority: P2)

**Goal**: ユーザーが自分の「つながりリスト」内で該当アクティビティOKのイベント投稿をタイムラインで閲覧し、参加したいイベントを探す

**Independent Test**: タイムラインに複数のイベント投稿が表示され、各投稿のカテゴリ、日時、人数、価格帯、コメントが閲覧可能で、自分のつながりリスト内の該当カテゴリOK投稿のみが表示されることを確認

**Acceptance Scenarios**: 5シナリオ（spec.md参照）

### Unit Tests for User Story 2（TDD Phase 2）

- [X] T074 [P] [US2] Write unit test for timeline fetch service in lib/services/timeline.service.test.ts
- [X] T075 [P] [US2] Write unit test for infinite scroll pagination in lib/services/timeline.service.test.ts

### Implementation for User Story 2（TDD Phase 3）

#### ビジネスロジック・サービス層

- [X] T076 [US2] Implement timeline fetch service with RLS filtering in lib/services/timeline.service.ts
- [X] T077 [US2] Implement pagination logic for infinite scroll (20件ずつ)

#### Server Actions

- [X] T078 [US2] Create timeline fetch Server Action in app/actions/fetchTimeline.ts
- [X] T079 [US2] Write integration test for timeline fetch API in app/actions/fetchTimeline.test.ts

#### UIコンポーネント

- [X] T080 [P] [US2] Create EventTimeline component in components/events/EventTimeline.tsx
- [X] T081 [US2] Implement infinite scroll with React Query in EventTimeline
- [X] T082 [US2] Add loading skeleton for timeline in EventTimeline
- [X] T083 [US2] Add empty state message in EventTimeline
- [X] T084 [US2] Write unit test for EventTimeline in components/events/EventTimeline.test.tsx

#### ページ実装

- [X] T085 [US2] Update timeline page (ホーム画面) in app/page.tsx
- [X] T086 [US2] Integrate EventTimeline component with fetchTimeline Server Action

### E2E Tests for User Story 2（TDD Phase 4）

- [ ] T087 [US2] E2E test: タイムライン表示（シナリオ1） in tests/e2e/user-story-2.spec.ts
- [ ] T088 [US2] E2E test: 投稿カード情報表示（シナリオ2） in tests/e2e/user-story-2.spec.ts
- [ ] T089 [US2] E2E test: 匿名化確認（シナリオ3） in tests/e2e/user-story-2.spec.ts
- [ ] T090 [US2] E2E test: 無限スクロール（シナリオ4） in tests/e2e/user-story-2.spec.ts
- [ ] T091 [US2] E2E test: 空状態メッセージ表示（シナリオ5） in tests/e2e/user-story-2.spec.ts

### Edge Cases for User Story 2

- [ ] T092 [US2] Handle simultaneous posts from multiple users with real-time update
- [ ] T093 [US2] Optimize timeline query performance for 50+ events

**Checkpoint**: User Story 1とUser Story 2が両方とも独立して機能

---

## Phase 5: User Story 3 - イベント情報編集（投稿者のみ・参加者確定前） (Priority: P3)

**Goal**: 投稿者（仮幹事）が投稿後にイベント情報を編集できる（参加者承認前のみ）

**Independent Test**: 自分が投稿したイベントの編集画面から情報を変更し、タイムラインとマイイベントに反映されることを確認

**Acceptance Scenarios**: 4シナリオ（spec.md参照）

### Unit Tests for User Story 3（TDD Phase 2）

- [ ] T094 [P] [US3] Write unit test for event update service in lib/services/event.service.test.ts
- [ ] T095 [P] [US3] Write unit test for edit permission check in lib/services/event.service.test.ts

### Implementation for User Story 3（TDD Phase 3）

#### ビジネスロジック・サービス層

- [ ] T096 [US3] Implement event update service in lib/services/event.service.ts
- [ ] T097 [US3] Implement edit permission check (status === 'recruiting' && host_id === current_user)

#### Server Actions

- [ ] T098 [US3] Create event update Server Action in app/actions/updateEvent.ts
- [ ] T099 [US3] Write integration test for event update API in app/actions/updateEvent.test.ts

#### UIコンポーネント

- [ ] T100 [P] [US3] Create EditEventModal component in components/events/EditEventModal.tsx
- [ ] T101 [US3] Pre-fill existing event data in EditEventModal
- [ ] T102 [US3] Add permission check for edit button visibility
- [ ] T103 [US3] Add warning message for confirmed events
- [ ] T104 [US3] Write unit test for EditEventModal in components/events/EditEventModal.test.tsx

#### ページ実装

- [ ] T105 [US3] Create My Events page in app/my/page.tsx
- [ ] T106 [US3] Add edit button to EventCard for own events
- [ ] T107 [US3] Integrate EditEventModal with updateEvent Server Action

### E2E Tests for User Story 3（TDD Phase 4）

- [ ] T108 [US3] E2E test: 編集画面表示（シナリオ1） in tests/e2e/user-story-3.spec.ts
- [ ] T109 [US3] E2E test: イベント編集反映（シナリオ2） in tests/e2e/user-story-3.spec.ts
- [ ] T110 [US3] E2E test: 参加者承認後の編集不可（シナリオ3） in tests/e2e/user-story-3.spec.ts
- [ ] T111 [US3] E2E test: 他ユーザーの投稿編集ボタン非表示（シナリオ4） in tests/e2e/user-story-3.spec.ts

### イベント中止機能（FR-020対応）

**Goal**: 幹事がイベント中止ボタンでイベントをキャンセルできる（タイムラインから非表示、参加者には通知）

#### Unit Tests for イベント中止機能（TDD Phase 2）

- [ ] T112 [P] Write unit test for event cancellation service in lib/services/event.service.test.ts
- [ ] T113 [P] Write unit test for cancellation permission check (host only) in lib/services/event.service.test.ts

#### Implementation for イベント中止機能（TDD Phase 3）

- [ ] T114 Implement event cancellation service in lib/services/event.service.ts
- [ ] T115 Update event status to 'cancelled' and set cancelled_at timestamp
- [ ] T116 Create cancellation Server Action in app/actions/cancelEvent.ts
- [ ] T117 Write integration test for cancellation Server Action in app/actions/cancelEvent.test.ts

#### UIコンポーネント

- [ ] T118 [P] Add cancel button to EventCard (visible only for host) in components/events/EventCard.tsx
- [ ] T119 [P] Create CancelEventModal confirmation dialog in components/events/CancelEventModal.tsx
- [ ] T120 Integrate CancelEventModal with cancelEvent Server Action
- [ ] T121 Write unit test for CancelEventModal in components/events/CancelEventModal.test.tsx

#### E2E Tests for イベント中止機能（TDD Phase 4）

- [ ] T122 E2E test: イベント中止ボタン表示（幹事のみ） in tests/e2e/event-cancellation.spec.ts
- [ ] T123 E2E test: イベント中止実行とタイムライン非表示 in tests/e2e/event-cancellation.spec.ts
- [ ] T124 E2E test: 中止イベントの参加者への通知 in tests/e2e/event-cancellation.spec.ts

**Checkpoint**: すべてのUser Storyが独立して機能

---

## Phase 4.5: User Story 4 - 簡易認証機能（匿名ログイン） (Priority: P2)

**Goal**: ユーザーが簡易的な認証機能を使ってログインし、イベント投稿・閲覧機能を利用できる

**Independent Test**: 初回訪問時にユーザー作成画面が表示され、表示名を入力後に自動的にログイン状態となり、イベント投稿・タイムライン閲覧が可能になることを確認

**Acceptance Scenarios**: 5シナリオ（spec.md参照）

### Unit Tests for User Story 4（TDD Phase 2）

> **NOTE: 実装前にテストを作成し、REDになることを確認**

- [ ] T146 [P] [US4] Write unit test for anonymous sign-in service in lib/services/auth.service.test.ts
- [ ] T147 [P] [US4] Write unit test for display name validation in lib/validation/user.schema.test.ts
- [ ] T148 [P] [US4] Write unit test for session management in lib/services/auth.service.test.ts

### Implementation for User Story 4（TDD Phase 3）

#### 認証サービス層

- [ ] T149 [US4] Implement anonymous sign-in service in lib/services/auth.service.ts
- [ ] T150 [US4] Implement session management logic (check/refresh) in auth service
- [ ] T151 [US4] Implement logout service in auth service

#### Server Actions

- [ ] T152 [US4] Create anonymous sign-in Server Action in app/actions/signIn.ts
- [ ] T153 [US4] Write integration test for sign-in API in app/actions/signIn.test.ts
- [ ] T154 [US4] Create logout Server Action in app/actions/signOut.ts
- [ ] T155 [US4] Write integration test for logout API in app/actions/signOut.test.ts

#### UIコンポーネント

- [ ] T156 [P] [US4] Create WelcomeScreen component in app/(auth)/welcome/page.tsx
- [ ] T157 [US4] Add display name input form to WelcomeScreen with validation
- [ ] T158 [US4] Add loading state and error handling to WelcomeScreen
- [ ] T159 [US4] Write unit test for WelcomeScreen in app/(auth)/welcome/page.test.tsx
- [ ] T160 [P] [US4] Create auth middleware in middleware.ts for route protection
- [ ] T161 [US4] Add logout button to settings or profile page

#### 統合

- [ ] T162 [US4] Integrate WelcomeScreen with signIn Server Action
- [ ] T163 [US4] Add session check on app initialization (root layout)
- [ ] T164 [US4] Add redirect logic for authenticated/unauthenticated users
- [ ] T165 [US4] Remove NEXT_PUBLIC_SKIP_AUTH flag from .env and code (app/actions/createEvent.ts, lib/services/timeline.service.ts)

### E2E Tests for User Story 4（TDD Phase 4）

> **IMPORTANT: spec.mdの受入シナリオ5つすべてをテストケース化**

- [ ] T166 [US4] E2E test: 初回訪問時の登録画面表示（シナリオ1） in tests/e2e/user-story-4.spec.ts
- [ ] T167 [US4] E2E test: 表示名入力後の自動ログイン（シナリオ2） in tests/e2e/user-story-4.spec.ts
- [ ] T168 [US4] E2E test: ログイン済みユーザーの登録画面スキップ（シナリオ3） in tests/e2e/user-story-4.spec.ts
- [ ] T169 [US4] E2E test: セッション維持（ブラウザ再起動後）（シナリオ4） in tests/e2e/user-story-4.spec.ts
- [ ] T170 [US4] E2E test: ログアウト機能（シナリオ5） in tests/e2e/user-story-4.spec.ts

### Edge Cases for User Story 4

- [ ] T171 [US4] Add validation for empty display name in user.schema.ts
- [ ] T172 [US4] Add validation for display name length (1-50 chars) in user.schema.ts
- [ ] T173 [US4] Handle session expiration with automatic re-registration
- [ ] T174 [US4] Add warning message for logout (data loss) with confirmation dialog

**Checkpoint**: User Story 4が完全に機能し、認証スキップコードが完全に削除された

---

## Phase 6: Polish & Cross-Cutting Concerns

**目的**: 複数のUser Storyに影響する改善・追加機能

### エラーハンドリング統一

- [ ] T125 [P] Create unified error response format in lib/utils/apiResponse.ts
- [ ] T126 [P] Add error code constants in lib/constants/errorCodes.ts
- [ ] T127 Standardize all API error responses to {success, message, code} format
- [ ] T128 Add error boundary for client-side errors

### パフォーマンス最適化

- [ ] T129 [P] Add database indexes verification (events_timeline, connections_category_flags)
- [ ] T130 [P] Optimize timeline query with EXPLAIN ANALYZE
- [ ] T131 [P] Add React.memo to EventCard component
- [ ] T132 [P] Add image optimization with Next.js Image component

### ローディング・トースト通知

- [ ] T133 [P] Add loading skeleton for all async operations
- [ ] T134 [P] Standardize toast notification messages
- [ ] T135 [P] Add success toast for event creation
- [ ] T136 [P] Add success toast for event update
- [ ] T137 [P] Add success toast for event cancellation

### ドキュメント・品質保証

- [ ] T138 [P] Update README.md with project setup instructions
- [ ] T139 [P] Create API documentation from contracts/api.yaml
- [ ] T140 [P] Run TypeScript type check (npm run type-check)
- [ ] T141 [P] Run ESLint and fix all warnings (npm run lint)
- [ ] T142 [P] Verify all E2E tests pass (npm run test:e2e)
- [ ] T143 [P] Verify all unit/integration tests pass (npm test)
- [ ] T144 Validate quickstart.md setup steps
- [ ] T145 Create deployment guide in docs/deployment.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし - 即座に開始可能
- **Foundational (Phase 2)**: Setupに依存 - すべてのUser Storyをブロック
- **User Stories (Phase 3-5)**: Foundationalに依存
  - 並行実行可能（チーム体制による）
  - または優先度順に順次実行（P1 → P2 → P3）
- **Polish (Phase 6)**: 必要なUser Storyの完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundational完了後に開始可能 - 他ストーリーへの依存なし（開発時は認証スキップで動作確認）
- **User Story 2 (P2)**: Foundational完了後に開始可能 - US1と統合するが独立してテスト可能（開発時は認証スキップで動作確認）
- **User Story 4 (P2)**: Foundational完了後に開始可能 - US1/US2の前提条件だが、開発順序としては後から実装可能（認証スキップコードを削除してUS4で置き換え）
- **User Story 3 (P3)**: Foundational完了後に開始可能 - US1/US2/US4と統合するが独立してテスト可能

### Within Each User Story

- テスト作成 → 実装（TDD: RED → GREEN → REFACTOR）
- 単体テスト → 統合テスト → E2Eテスト
- ビジネスロジック → Server Actions → UIコンポーネント
- コアロジック実装 → 統合 → エッジケース対応

### Parallel Opportunities

- Phase 1のすべての[P]タスクは並行実行可能
- Phase 2のすべての[P]タスクは並行実行可能（フェーズ内）
- Foundational完了後、すべてのUser Storyは並行開始可能（チーム体制による）
- 各User Story内の[P]タスクは並行実行可能
- 異なるUser Storyは異なるチームメンバーが並行作業可能

---

## Implementation Strategy

### MVP First（User Story 1のみ）

1. Phase 1: Setup完了
2. Phase 2: Foundational完了（CRITICAL - すべてのストーリーをブロック）
3. Phase 3: User Story 1完了
4. **STOP and VALIDATE**: User Story 1を独立してテスト
5. 準備できればデプロイ/デモ

### Incremental Delivery

1. Setup + Foundational完了 → 基盤準備完了
2. User Story 1追加 → 独立テスト → デプロイ/デモ（認証スキップで動作確認）
3. User Story 2追加 → 独立テスト → デプロイ/デモ（認証スキップで動作確認）
4. User Story 4追加 → 認証スキップコード削除 → 独立テスト → デプロイ/デモ（本番用認証機能）
5. User Story 3追加 → 独立テスト → デプロイ/デモ
6. 各ストーリーが既存機能を壊さずに価値を追加

### Parallel Team Strategy

複数の開発者がいる場合:

1. チーム全体でSetup + Foundationalを完了
2. Foundational完了後:
   - Developer A: User Story 1（認証スキップで動作確認）
   - Developer B: User Story 2（認証スキップで動作確認）
   - Developer C: User Story 4（認証機能実装、認証スキップコード削除）
   - Developer D: User Story 3（US4完了後に開始推奨）
3. 各ストーリーを独立して完了・統合

---

## Notes

- **[P]タスク** = 異なるファイル、依存関係なし
- **[Story]ラベル** = タスクを特定のUser Storyにマッピング（トレーサビリティ）
- 各User Storyは独立して完了・テスト可能
- テスト作成時は必ずREDを確認してから実装
- 各タスクまたは論理的なグループ単位でコミット
- 各チェックポイントでストーリーを独立して検証
- **避けるべき**: 曖昧なタスク、同一ファイルの競合、ストーリー間の依存関係による独立性の破壊

---

## Task Count Summary

- **Phase 1 (Setup)**: 9 tasks
- **Phase 2 (Foundational)**: 29 tasks
- **Phase 3 (User Story 1)**: 35 tasks
- **Phase 4 (User Story 2)**: 20 tasks
- **Phase 4.5 (User Story 4)**: 29 tasks
- **Phase 5 (User Story 3)**: 18 tasks
- **Phase 6 (Polish)**: 26 tasks

**Total**: 166 tasks

---

## MVP Recommendation

最小限のMVPとしてUser Story 1（P1）のみを実装する場合:

**必須タスク**: Phase 1（9タスク）+ Phase 2（29タスク）+ Phase 3（35タスク）= **73タスク**

この構成で、匿名イベント投稿とつながりリストベースの配信機能が完全に動作します。
