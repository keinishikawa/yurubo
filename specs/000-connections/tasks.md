# Tasks: つながり管理（Connections）

**Input**: Design documents from `/specs/000-connections/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md

**Tests**: TDD必須（憲法 Principle III）。E2E優先で実装。

**Organization**: タスクはUser Story単位でグループ化。各ストーリーは独立してテスト・デプロイ可能。

**Progress Tracking**: `/speckit.implement` が完了タスクを自動的に `[X]` でマーク。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（別ファイル、依存なし）
- **[Story]**: User Story番号（US1, US2, US3, US4, US5）

---

## Phase 1: Setup（共有インフラ）

**Purpose**: プロジェクト構造の準備とディレクトリ作成

- [X] T001 つながり機能用ディレクトリを作成 `app/actions/connections/`
- [X] T002 [P] 通知機能用ディレクトリを作成 `app/actions/notifications/`
- [X] T003 [P] つながりコンポーネント用ディレクトリを作成 `components/connections/`
- [X] T004 [P] つながりページ用ディレクトリを作成 `app/(auth)/connections/`
- [X] T005 Zodバリデーションスキーマを作成 `lib/validation/connections.ts`

---

## Phase 2: Foundational（ブロッキング前提条件）

**Purpose**: 全User Storyの前提となるデータベース・型定義

**⚠️ CRITICAL**: このフェーズが完了するまでUser Story実装は開始不可

- [x] T006 connection_requestsテーブルのマイグレーションを作成 `supabase/migrations/20251203000001_create_connection_requests_table.sql`
- [x] T007 [P] notificationsテーブルのマイグレーションを作成 `supabase/migrations/20251203000002_create_notifications_table.sql`
- [x] T008 マイグレーション適用とSupabase型定義を再生成 `supabase db reset && supabase gen types typescript --local`
- [x] T009 connection_requestsとnotificationsテーブルのRLSポリシーが正しく設定されていることを確認

**Checkpoint**: データベース準備完了 - User Story実装開始可能

---

## Phase 3: User Story 1 - つながりの追加 (Priority: P1) 🎯 MVP

**Goal**: ユーザーが友人を検索し、つながりリクエストを送信して承認されるまでの基本フロー

**Independent Test**: 友人検索→リクエスト送信→承認→つながりリスト表示の一連フロー

### E2Eテスト for User Story 1

- [X] T010 [US1] ユーザー検索とリクエスト送信フローのE2Eテストを作成 `tests/e2e/connections/us1-add-connection.spec.ts`

### Implementation for User Story 1

- [X] T011 [P] [US1] searchUsers Server Actionを実装 `app/actions/connections/search-users.ts`
- [X] T012 [P] [US1] sendConnectionRequest Server Actionを実装 `app/actions/connections/send-request.ts`
- [X] T013 [US1] getReceivedRequests Server Actionを実装 `app/actions/connections/get-requests.ts`
- [X] T014 [US1] acceptConnectionRequest Server Actionを実装 `app/actions/connections/accept-request.ts`
- [X] T015 [P] [US1] UserSearchInputコンポーネントを作成 `components/connections/user-search-input.tsx`
- [X] T016 [P] [US1] UserSearchResultコンポーネントを作成 `components/connections/user-search-result.tsx`
- [X] T017 [US1] ユーザー検索ページを作成 `app/(auth)/connections/search/page.tsx`
- [X] T018 [US1] 既につながりのある相手に「友人」ラベルを表示し、リクエストボタンを非表示にする
- [X] T019 [US1] 同時リクエスト検出ロジックを実装（相互リクエスト時は自動でつながり成立） `send-request.ts`

**Checkpoint**: User Story 1完了 - 友人検索・リクエスト送信・承認が機能

---

## Phase 4: User Story 2 - つながりリクエストの承認・拒否 (Priority: P1)

**Goal**: ユーザーが受信したリクエストを承認または拒否できる

**Independent Test**: リクエスト一覧表示→承認/拒否→リスト更新

### E2Eテスト for User Story 2

- [ ] T020 [US2] リクエスト承認・拒否フローのE2Eテストを作成 `tests/e2e/connections/us2-request-management.spec.ts`

### Implementation for User Story 2

- [ ] T021 [US2] rejectConnectionRequest Server Actionを実装 `app/actions/connections/reject-request.ts`
- [ ] T022 [P] [US2] RequestCardコンポーネントを作成 `components/connections/request-card.tsx`
- [ ] T023 [P] [US2] RequestListコンポーネントを作成 `components/connections/request-list.tsx`
- [ ] T024 [US2] リクエスト一覧ページを作成 `app/(auth)/connections/requests/page.tsx`
- [ ] T025 [US2] 期限切れリクエストのフィルタリングを追加（expires_atチェック） `getReceivedRequests`
- [ ] T026 [US2] リクエスト承認時に送信者への通知作成を実装 `accept-request.ts`

**Checkpoint**: User Story 1 & 2完了 - つながり成立の基本フロー完成

---

## Phase 5: User Story 3 - アクティビティ単位の関係設定 (Priority: P2)

**Goal**: つながりごとにカテゴリ（飲み・旅行・スポーツ等）を設定できる

**Independent Test**: カテゴリ編集画面でチェック→保存→再表示で反映確認

### E2Eテスト for User Story 3

- [ ] T027 [US3] カテゴリ設定のE2Eテストを作成 `tests/e2e/connections/us3-category-settings.spec.ts`

### Implementation for User Story 3

- [ ] T028 [US3] updateConnectionCategories Server Actionを実装 `app/actions/connections/update-categories.ts`
- [ ] T029 [US3] CategoryEditorコンポーネントを作成 `components/connections/category-editor.tsx`
- [ ] T030 [US3] ユーザーのenabled_categoriesに基づいてカテゴリをフィルタリング（自分のカテゴリのみ表示）
- [ ] T031 [US3] category_flagsをユーザーのenabled_categoriesに対してバリデーション `update-categories.ts`

**Checkpoint**: User Story 3完了 - カテゴリ設定が機能

---

## Phase 6: User Story 4 - つながりリストの閲覧・管理 (Priority: P2)

**Goal**: つながりリスト一覧表示、フィルタ、検索、削除

**Independent Test**: リスト表示→フィルタ→検索→削除の各機能

### E2Eテスト for User Story 4

- [X] T032 [US4] つながりリスト管理のE2Eテストを作成 `tests/e2e/connections/us4-list-management.spec.ts`

### Implementation for User Story 4

- [X] T033 [US4] getConnections Server Actionを実装 `app/actions/connections/get-connections.ts`
- [X] T034 [US4] deleteConnection Server Actionを実装 `app/actions/connections/delete-connection.ts`
- [X] T035 [P] [US4] ConnectionCardコンポーネントを作成 `components/connections/connection-card.tsx`
- [X] T036 [P] [US4] ConnectionListコンポーネントを作成 `components/connections/connection-list.tsx`
- [X] T037 [US4] つながりリストページを作成 `app/(auth)/connections/page.tsx`
- [X] T038 [US4] カテゴリフィルタ機能をつながりリストに追加
- [X] T039 [US4] 名前検索機能をつながりリストに追加
- [X] T040 [US4] 削除確認ダイアログを追加

**Checkpoint**: User Story 4完了 - つながりリスト管理が機能

---

## Phase 7: 通知機能（US1/US2サポート）

**Goal**: リクエスト受信・承認時の通知表示

**Independent Test**: 通知バッジ表示→一覧表示→既読更新

### E2Eテスト for Notifications

- [ ] T041 通知フローのE2Eテストを作成 `tests/e2e/connections/notifications.spec.ts`

### Implementation for Notifications

- [ ] T042 getNotifications Server Actionを実装 `app/actions/notifications/get-notifications.ts`
- [ ] T043 [P] markNotificationAsRead Server Actionを実装 `app/actions/notifications/mark-as-read.ts`
- [ ] T044 NotificationBadgeコンポーネントを作成 `components/connections/notification-badge.tsx`
- [ ] T045 通知バッジをヘッダー/ナビゲーションに統合

**Checkpoint**: 通知機能完了

---

## Phase 8: User Story 5 - イベント配信フィルタリング (Priority: P3)

**Goal**: カテゴリ設定に基づくイベント配信（Epic 001連携）

**Note**: Epic 001（イベント作成）実装後に着手

**Independent Test**: イベント投稿後、カテゴリ設定に応じた配信確認

### Implementation for User Story 5 (Epic 001連携時)

- [ ] T046 [US5] 双方向カテゴリチェックロジックを設計（両者がOKの場合のみ配信）
- [ ] T047 [US5] getEligibleRecipients関数を実装 `lib/services/connection.service.ts`
- [ ] T048 [US5] イベント配信フィルタリングの統合テストを作成

**Checkpoint**: User Story 5完了 - イベント配信フィルタリングが機能

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 品質向上、パフォーマンス最適化

- [ ] T049 [P] 全つながりページにローディング状態を追加
- [ ] T050 [P] エラーハンドリングとトースト通知を追加
- [ ] T051 [P] アクセシビリティ属性を追加（aria-labels、キーボードナビゲーション）
- [ ] T052 つながりリストのパフォーマンス最適化（ページネーション、無限スクロール）
- [ ] T053 `npm run precheck` を実行して全チェックがパスすることを確認
- [ ] T054 connection.service.tsに新規関数のドキュメントを追加

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし - 即時開始可能
- **Foundational (Phase 2)**: Setup完了後 - 全User Storyをブロック
- **User Stories (Phase 3-6)**: Foundational完了後に開始可能
  - US1とUS2は密接に関連（P1優先度）
  - US3とUS4は独立（P2優先度）
- **通知機能 (Phase 7)**: US1/US2と並行可能
- **US5 (Phase 8)**: Epic 001実装後
- **Polish (Phase 9)**: 全User Story完了後

### User Story Dependencies

| Story | 依存先 | 並列実行 |
|-------|--------|----------|
| US1 | Foundational | - |
| US2 | US1のT013, T014を共有 | US1と連続 |
| US3 | Foundational | US1/US2完了後推奨 |
| US4 | Foundational | US1/US2完了後推奨 |
| US5 | Epic 001 | 後日 |

### Parallel Opportunities

**Phase 1内の並列タスク**:
- T002, T003, T004（ディレクトリ作成）

**Phase 2内の並列タスク**:
- T006, T007（マイグレーション作成）

**US1内の並列タスク**:
- T011, T012（Server Actions）
- T015, T016（コンポーネント）

**US4内の並列タスク**:
- T035, T036（コンポーネント）

---

## Parallel Example: User Story 1

```bash
# Server Actions を並列実行:
Task: "T011 [P] [US1] searchUsers Server Actionを実装"
Task: "T012 [P] [US1] sendConnectionRequest Server Actionを実装"

# コンポーネントを並列実行:
Task: "T015 [P] [US1] UserSearchInputコンポーネントを作成"
Task: "T016 [P] [US1] UserSearchResultコンポーネントを作成"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Phase 1: Setup完了
2. Phase 2: Foundational完了 ← **CRITICAL GATE**
3. Phase 3: User Story 1完了
4. Phase 4: User Story 2完了
5. **STOP and VALIDATE**: つながり追加・承認の基本フローをテスト
6. Deploy/Demo（MVP完成）

### Incremental Delivery

1. Setup + Foundational → DB準備完了
2. US1 + US2 → つながり成立フロー完成 → **MVP Deploy**
3. US3 → カテゴリ設定追加 → Deploy
4. US4 → リスト管理追加 → Deploy
5. 通知機能 → UX向上 → Deploy
6. US5 → Epic 001連携時に実装

---

## Summary

| フェーズ | タスク数 | 優先度 |
|----------|----------|--------|
| Phase 1: Setup | 5 | - |
| Phase 2: Foundational | 4 | - |
| Phase 3: US1 | 10 | P1 |
| Phase 4: US2 | 7 | P1 |
| Phase 5: US3 | 5 | P2 |
| Phase 6: US4 | 9 | P2 |
| Phase 7: Notifications | 5 | P2 |
| Phase 8: US5 | 3 | P3 |
| Phase 9: Polish | 6 | - |
| **合計** | **54** | - |

---

## Notes

- [P] タスク = 別ファイル、依存なしで並列実行可能
- [Story] ラベル = 特定のUser Storyへのトレーサビリティ
- 各User Storyは独立して完了・テスト可能
- TDD必須: E2Eテストを先に作成し、FAIL確認後に実装
- チェックポイントごとに独立したストーリーを検証
- **IMPORTANT**: `/speckit.implement` が完了タスクを自動的に `[X]` でマーク
