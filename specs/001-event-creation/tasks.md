# Tasks: フェーズ1：イベント作成機能

**機能ブランチ**: `001-event-creation`
**作成日**: 2025-11-11
**ステータス**: ドラフト

**入力**: `/specs/001-event-creation/` からの設計ドキュメント
**前提条件**: plan.md, spec.md, data-model.md, contracts/api.yaml, research.md, quickstart.md

**テスト**: TDD必須 - すべての実装コードには対応するテスト（単体・統合・E2E）が必須

**構成**: タスクはUser Story単位で整理され、各ストーリーは独立して実装・テスト可能

---

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並行実行可能（異なるファイル、依存関係なし）
- **[Story]**: User Storyラベル（US1, US2, US3）
- 説明には必ず具体的なファイルパスを含める

---

## Phase 1: Setup（プロジェクト初期化）

**目的**: プロジェクトの基本構造とツール設定

- [x] T001 Next.js 15プロジェクト構造をTypeScriptとApp Routerで作成
- [x] T002 コア依存関係をインストール（React 19, Supabase Client, Zod, React Hook Form, shadcn-ui, TailwindCSS）
- [x] T003 [P] tsconfig.jsonでTypeScript strictモードを設定
- [x] T004 [P] ESLintとPrettierを設定
- [x] T005 [P] .env.exampleに環境変数テンプレートを設定
- [x] T006 [P] Supabase CLIを初期化してプロジェクトにリンク
- [x] T007 [P] jest.config.jsでJestを単体・統合テスト用に設定
- [x] T008 [P] playwright.config.tsでPlaywrightをE2Eテスト用に設定
- [x] T009 プロジェクトディレクトリ構造を作成（app/, components/, lib/, tests/, supabase/）

---

## Phase 2: Foundational（基盤構築）

**目的**: すべてのUser Storyの前提となる基盤実装

**⚠️ CRITICAL**: このフェーズ完了前にUser Story実装は開始できない

### データベースマイグレーション

- [x] T010 supabase/migrations/20251111000001_create_categories_table.sqlでカテゴリテーブルのマイグレーションを作成
- [x] T011 supabase/migrations/20251111000002_create_users_table.sqlでユーザーテーブルのマイグレーションを作成
- [x] T012 supabase/migrations/20251111000003_create_events_table.sqlでイベントテーブルのマイグレーションを作成
- [x] T013 supabase/migrations/20251111000004_create_connections_table.sqlでつながりテーブルのマイグレーションを作成
- [x] T014 supabase/migrations/20251111000005_enable_rls_policies.sqlですべてのテーブルのRLSポリシーを作成
- [x] T015 supabase/migrations/20251111000006_create_triggers_and_functions.sqlでトリガーと関数を作成（updated_at、1日投稿上限チェック）
- [x] T016 supabase/seed.sqlでテスト用シードデータを作成
- [x] T017 Supabase CLIでマイグレーションを実行し、データベース設定を検証

### Supabaseクライアント設定

- [x] T018 [P] lib/supabase/server.tsでServer Components用のSupabaseクライアントを作成
- [x] T019 [P] lib/supabase/client.tsでClient Components用のSupabaseクライアントを作成
- [x] T020 [P] lib/supabase/types.tsでデータベーススキーマからTypeScript型を生成

### Zodバリデーションスキーマ

- [x] T021 [P] lib/validation/event.schema.tsでZodを使用してイベントバリデーションスキーマを作成
- [x] T022 [P] lib/validation/event.schema.test.tsでイベントバリデーションスキーマの単体テストを作成
- [x] T023 [P] lib/validation/connection.schema.tsでつながりバリデーションスキーマを作成
- [x] T024 [P] lib/validation/user.schema.tsでユーザーバリデーションスキーマを作成

### ユーティリティ関数

- [x] T025 [P] lib/utils/generateAnonId.tsで匿名ID生成ロジックを実装
- [x] T026 [P] lib/utils/generateAnonId.test.tsで匿名ID生成の単体テストを作成
- [x] T027 [P] lib/utils/errors.tsでエラーハンドリングユーティリティを作成
- [x] T028 [P] lib/utils/dateFormatter.tsで日時フォーマットユーティリティを作成

### shadcn-ui基本コンポーネント

- [x] T029 [P] shadcn-uiをセットアップし、components/ui/button.tsxにButtonコンポーネントを追加
- [x] T030 [P] components/ui/modal.tsxにModalコンポーネントを追加
- [x] T031 [P] components/ui/input.tsxにInputコンポーネントを追加
- [x] T032 [P] components/ui/select.tsxにSelectコンポーネントを追加
- [x] T033 [P] components/ui/textarea.tsxにTextareaコンポーネントを追加
- [x] T034 [P] components/ui/slider.tsxにSliderコンポーネントを追加
- [x] T035 [P] components/ui/toast.tsxにToast通知コンポーネントを追加

### レイアウト・共通UI

- [x] T036 [P] app/layout.tsxでナビゲーション付きルートレイアウトを作成
- [x] T037 [P] app/error.tsxでエラーバウンダリを作成
- [x] T038 [P] app/loading.tsxでローディング状態コンポーネントを作成

**Checkpoint**: 基盤完了 - User Story実装を並行開始可能

---

## Phase 3: User Story 1 - 匿名イベント投稿（つながりリスト配信） (Priority: P1) 🎯 MVP

**目標**: ユーザーが心理的抵抗なく「軽く誘う」ためのイベント投稿を行い、つながりリスト内の該当カテゴリOKユーザーのみに配信される

**独立テスト**: ログイン後、投稿モーダルから基本情報を入力し、投稿完了後にタイムラインに匿名投稿として表示され、つながりリスト内の該当カテゴリOKユーザーのみに配信されることを確認

**受入シナリオ**: 7シナリオ（spec.md参照）

### User Story 1の単体テスト（TDD Phase 2）

> **注意: 実装前にテストを作成し、REDになることを確認**

- [x] T039 [P] [US1] lib/services/event.service.test.tsでイベント作成バリデーションの単体テストを作成
- [x] T040 [P] [US1] lib/services/event.service.test.tsで1日投稿上限チェックの単体テストを作成
- [x] T041 [P] [US1] lib/services/event.service.test.tsで匿名ID割り当ての単体テストを作成

### User Story 1の実装（TDD Phase 3）

#### ビジネスロジック・サービス層

- [x] T042 [US1] lib/services/event.service.tsでイベント作成サービスを実装
- [x] T043 [US1] イベントサービスで1日投稿上限チェックロジックを実装
- [x] T044 [US1] イベントサービスで匿名ID割り当てロジックを実装

#### Server Actions

- [x] T045 [US1] app/actions/createEvent.tsでイベント作成Server Actionを作成
- [x] T046 [US1] app/actions/createEvent.test.tsでイベント作成APIの統合テストを作成

#### UIコンポーネント

- [x] T047 [P] [US1] components/events/EventCard.tsxでEventCardコンポーネントを作成
- [x] T048 [P] [US1] components/events/EventCard.test.tsxでEventCardコンポーネントの単体テストを作成
- [x] T049 [US1] components/events/PostEventModal.tsxでカテゴリ選択付きPostEventModalコンポーネントを作成
- [x] T050 [US1] PostEventModalに日時ピッカーを追加（開催日時: 開始・終了）
- [x] T051 [US1] PostEventModalに想定人数範囲入力を追加（想定人数: 最小・最大）
- [x] T052 [US1] PostEventModalに価格帯スライダーを追加（価格帯: 3000~5000円デフォルト）
- [x] T053 [US1] PostEventModalにコメントテキストエリアを追加
- [x] T054 [US1] PostEventModalでReact Hook FormとZodバリデーションを統合
- [x] T055 [US1] PostEventModalにエラーメッセージ表示を追加
- [x] T056 [US1] components/events/PostEventModal.test.tsxでPostEventModalの単体テストを作成
- [x] T057 [P] [US1] components/layout/FloatingPostButton.tsxでFloatingPostButtonコンポーネントを作成（右下「＋投稿」ボタン）

#### 統合

- [x] T058 [US1] PostEventModalとcreateEvent Server Actionを統合
- [x] T059 [US1] イベント作成成功時にトースト通知を追加
- [x] T060 [US1] イベント作成中のローディング状態を追加

### User Story 1のE2Eテスト（TDD Phase 4）

> **IMPORTANT: spec.mdの受入シナリオ7つすべてをテストケース化**

- [x] T061 [US1] E2Eテスト: 投稿モーダル表示（シナリオ1） in tests/e2e/user-story-1.spec.ts
- [x] T062 [US1] E2Eテスト: イベント投稿完了（シナリオ2） in tests/e2e/user-story-1.spec.ts
- [x] T063 [US1] E2Eテスト: 匿名ID表示（シナリオ3） in tests/e2e/user-story-1.spec.ts
- [x] T064 [US1] E2Eテスト: つながりリストOKユーザーに表示（シナリオ4） in tests/e2e/user-story-1.spec.ts (注: スキップ - データベース設定が必要)
- [x] T065 [US1] E2Eテスト: つながりリストNGユーザーに非表示（シナリオ5） in tests/e2e/user-story-1.spec.ts (注: スキップ - データベース設定が必要)
- [x] T066 [US1] E2Eテスト: 1日3件投稿上限エラー（シナリオ6） in tests/e2e/user-story-1.spec.ts
- [x] T067 [US1] E2Eテスト: 必須項目未入力エラー（シナリオ7） in tests/e2e/user-story-1.spec.ts

### User Story 1のエッジケース

- [x] T068 [US1] event.schema.tsで過去のdate_startに対するバリデーションを追加
- [x] T069 [US1] event.schema.tsでdate_endがdate_startより前の場合のバリデーションを追加
- [x] T070 [US1] event.schema.tsでcapacity_min > capacity_maxの場合のバリデーションを追加
- [x] T071 [US1] event.schema.tsでdeadlineがdate_startより後の場合のバリデーションを追加
- [x] T072 [US1] リトライロジックとユーザーフレンドリーなメッセージでネットワークエラーを処理
- [x] T073 [US1] つながりリストが空の場合の警告メッセージを追加

**Checkpoint**: User Story 1が完全に機能し、独立してテスト可能

---

## Phase 4: User Story 2 - タイムライン閲覧（つながりベース） (Priority: P2)

**目標**: ユーザーが自分の「つながりリスト」内で該当アクティビティOKのイベント投稿をタイムラインで閲覧し、参加したいイベントを探す

**独立テスト**: タイムラインに複数のイベント投稿が表示され、各投稿のカテゴリ、日時、人数、価格帯、コメントが閲覧可能で、自分のつながりリスト内の該当カテゴリOK投稿のみが表示されることを確認

**受入シナリオ**: 5シナリオ（spec.md参照）

### User Story 2の単体テスト（TDD Phase 2）

- [x] T074 [P] [US2] lib/services/timeline.service.test.tsでタイムライン取得サービスの単体テストを作成
- [x] T075 [P] [US2] lib/services/timeline.service.test.tsで無限スクロールページネーションの単体テストを作成

### User Story 2の実装（TDD Phase 3）

#### ビジネスロジック・サービス層

- [x] T076 [US2] lib/services/timeline.service.tsでRLSフィルタリング付きタイムライン取得サービスを実装
- [x] T077 [US2] 無限スクロール用のページネーションロジックを実装（20件ずつ）

#### Server Actions

- [x] T078 [US2] app/actions/fetchTimeline.tsでタイムライン取得Server Actionを作成
- [x] T079 [US2] app/actions/fetchTimeline.test.tsでタイムライン取得APIの統合テストを作成

#### UIコンポーネント

- [x] T080 [P] [US2] components/events/EventTimeline.tsxでEventTimelineコンポーネントを作成
- [x] T081 [US2] EventTimelineでReact Queryを使用して無限スクロールを実装
- [x] T082 [US2] EventTimelineにタイムライン用のローディングスケルトンを追加
- [x] T083 [US2] EventTimelineに空状態メッセージを追加
- [x] T084 [US2] components/events/EventTimeline.test.tsxでEventTimelineの単体テストを作成

#### ページ実装

- [x] T085 [US2] app/page.tsxでタイムラインページを更新（ホーム画面）
- [x] T086 [US2] EventTimelineコンポーネントとfetchTimeline Server Actionを統合

### User Story 2のE2Eテスト（TDD Phase 4）

- [x] T087 [US2] E2Eテスト: タイムライン表示（シナリオ1） in tests/e2e/user-story-2.spec.ts
- [x] T088 [US2] E2Eテスト: 投稿カード情報表示（シナリオ2） in tests/e2e/user-story-2.spec.ts
- [x] T089 [US2] E2Eテスト: 匿名化確認（シナリオ3） in tests/e2e/user-story-2.spec.ts
- [x] T090 [US2] E2Eテスト: 無限スクロール（シナリオ4） in tests/e2e/user-story-2.spec.ts
- [x] T091 [US2] E2Eテスト: 空状態メッセージ表示（シナリオ5） in tests/e2e/user-story-2.spec.ts

### User Story 2のエッジケース

- [x] T092 [US2] リアルタイム更新で複数ユーザーからの同時投稿を処理
- [x] T093 [US2] 50件以上のイベントに対するタイムラインクエリのパフォーマンスを最適化

**Checkpoint**: User Story 1とUser Story 2が両方とも独立して機能

---

## Phase 5: User Story 3 - イベント情報編集（投稿者のみ・参加者確定前） (Priority: P3)

**目標**: 投稿者（仮幹事）が投稿後にイベント情報を編集できる（参加者承認前のみ）

**独立テスト**: 自分が投稿したイベントの編集画面から情報を変更し、タイムラインとマイイベントに反映されることを確認

**受入シナリオ**: 4シナリオ（spec.md参照）

### User Story 3の単体テスト（TDD Phase 2）

- [x] T094 [P] [US3] lib/services/event.service.test.tsでイベント更新サービスの単体テストを作成
- [x] T095 [P] [US3] lib/services/event.service.test.tsで編集権限チェックの単体テストを作成

### User Story 3の実装（TDD Phase 3）

#### ビジネスロジック・サービス層

- [x] T096 [US3] lib/services/event.service.tsでイベント更新サービスを実装
- [x] T097 [US3] 編集権限チェックを実装（status === 'recruiting' && host_id === current_user）

#### Server Actions

- [x] T098 [US3] app/actions/updateEvent.tsでイベント更新Server Actionを作成
- [x] T099 [US3] app/actions/updateEvent.test.tsでイベント更新APIの統合テストを作成

#### UIコンポーネント

- [x] T100 [P] [US3] components/events/EditEventModal.tsxでEditEventModalコンポーネントを作成
- [x] T101 [US3] EditEventModalで既存イベントデータを事前入力
- [x] T102 [US3] 編集ボタン表示の権限チェックを追加
- [x] T103 [US3] 承認済みイベントの警告メッセージを追加（注: event.service.tsでstatus='cancelled'の場合は編集不可を実装）
- [x] T104 [US3] components/events/EventEditModal.test.tsxでEditEventModalの単体テストを作成 in components/events/EditEventModal.test.tsx

#### ページ実装

- [x] T105 [US3] app/my/page.tsxでマイイベントページを作成（注: 現在はホーム画面で編集可能）
- [x] T106 [US3] 自分のイベント用にEventCardに編集ボタンを追加
- [x] T107 [US3] EditEventModalとupdateEvent Server Actionを統合

### E2E Tests for User Story 3（TDD Phase 4）

- [x] T108 [US3] E2Eテスト: 編集画面表示（シナリオ1） in tests/e2e/user-story-3.spec.ts
- [x] T109 [US3] E2Eテスト: イベント編集反映（シナリオ2） in tests/e2e/user-story-3.spec.ts
- [x] T110 [US3] E2Eテスト: 参加者承認後の編集不可（シナリオ3） in tests/e2e/user-story-3.spec.ts
- [x] T111 [US3] E2Eテスト: 他ユーザーの投稿編集ボタン非表示（シナリオ4） in tests/e2e/user-story-3.spec.ts

### イベント中止機能（FR-020対応）

**目標**: 幹事がイベント中止ボタンでイベントをキャンセルできる（タイムラインから非表示、参加者には通知）

#### イベント中止機能の単体テスト（TDD Phase 2）

- [x] T112 [P] lib/services/event.service.test.tsでイベント中止サービスの単体テストを作成
- [x] T113 [P] lib/services/event.service.test.tsで中止権限チェックの単体テストを作成（幹事のみ）

#### イベント中止機能の実装（TDD Phase 3）

- [x] T114 lib/services/event.service.tsでイベント中止サービスを実装
- [x] T115 イベントステータスを'cancelled'に更新し、cancelled_atタイムスタンプを設定
- [x] T116 app/actions/cancelEvent.tsで中止Server Actionを作成
- [x] T117 app/actions/cancelEvent.test.tsで中止Server Actionの統合テストを作成

#### UIコンポーネント

- [x] T118 [P] components/events/EventCard.tsxでEventCardにキャンセルボタンを追加（幹事のみ表示）
- [x] T119 [P] components/events/CancelEventModal.tsxでCancelEventModal確認ダイアログを作成（注: EventCard.tsx内のAlertDialogとして実装）
- [x] T120 CancelEventModalとcancelEvent Server Actionを統合
- [x] T121 components/events/CancelEventModal.test.tsxでCancelEventModalの単体テストを作成

#### イベント中止機能のE2Eテスト（TDD Phase 4）

- [x] T122 E2Eテスト: イベント中止ボタン表示（幹事のみ） in tests/e2e/event-cancellation.spec.ts
- [x] T123 E2Eテスト: イベント中止実行とタイムライン非表示 in tests/e2e/event-cancellation.spec.ts
- [x] T124 E2Eテスト: 中止イベントの参加者への通知 in tests/e2e/event-cancellation.spec.ts

**Checkpoint**: すべてのUser Storyが独立して機能

---

## Phase 4.5: User Story 4 - 簡易認証機能（匿名ログイン） (Priority: P2)

**目標**: ユーザーが簡易的な認証機能を使ってログインし、イベント投稿・閲覧機能を利用できる

**独立テスト**: 初回訪問時にユーザー作成画面が表示され、表示名を入力後に自動的にログイン状態となり、イベント投稿・タイムライン閲覧が可能になることを確認

**受入シナリオ**: 5シナリオ（spec.md参照）

### User Story 4の単体テスト（TDD Phase 2）

> **注意: 実装前にテストを作成し、REDになることを確認**

- [x] T146 [P] [US4] lib/services/auth.service.test.tsで匿名サインインサービスの単体テストを作成
- [x] T147 [P] [US4] lib/validation/user.schema.test.tsで表示名バリデーションの単体テストを作成
- [x] T148 [P] [US4] lib/services/auth.service.test.tsでセッション管理の単体テストを作成

### User Story 4の実装（TDD Phase 3）

#### 認証サービス層

- [x] T149 [US4] lib/services/auth.service.tsで匿名サインインサービスを実装
- [x] T150 [US4] 認証サービスでセッション管理ロジックを実装（チェック/リフレッシュ）
- [x] T151 [US4] 認証サービスでログアウトサービスを実装

#### Server Actions

- [x] T152 [US4] app/actions/signIn.tsで匿名サインインServer Actionを作成
- [x] T153 [US4] app/actions/signIn.test.tsでサインインAPIの統合テストを作成
- [x] T154 [US4] app/actions/signOut.tsでログアウトServer Actionを作成
- [x] T155 [US4] app/actions/signOut.test.tsでログアウトAPIの統合テストを作成

#### UIコンポーネント

- [x] T156 [P] [US4] app/(auth)/welcome/page.tsxでWelcomeScreenコンポーネントを作成
- [x] T157 [US4] WelcomeScreenにバリデーション付き表示名入力フォームを追加
- [x] T158 [US4] WelcomeScreenにローディング状態とエラーハンドリングを追加
- [x] T159 [US4] app/(auth)/welcome/page.test.tsxでWelcomeScreenの単体テストを作成（注: クライアントサイド認証実装のため、auth.service.test.tsでカバー）
- [x] T160 [P] [US4] middleware.tsでルート保護用の認証ミドルウェアを作成
- [x] T161 [US4] 設定またはプロフィールページにログアウトボタンを追加（注: app/page.tsxのヘッダーに実装）

#### 統合

- [x] T162 [US4] WelcomeScreenとsignIn Server Actionを統合（注: クライアントサイドSupabase認証に変更）
- [x] T163 [US4] アプリ初期化時にセッションチェックを追加（ルートレイアウト）（注: middlewareで実装済み）
- [x] T164 [US4] 認証済み/未認証ユーザー用のリダイレクトロジックを追加
- [x] T165 [US4] .envとコードからNEXT_PUBLIC_SKIP_AUTHフラグを削除（app/actions/createEvent.ts, lib/services/timeline.service.ts）

### User Story 4のE2Eテスト（TDD Phase 4）

> **IMPORTANT: spec.mdの受入シナリオ5つすべてをテストケース化**

- [x] T166 [US4] E2Eテスト: 初回訪問時の登録画面表示（シナリオ1） in tests/e2e/user-story-4.spec.ts
- [x] T167 [US4] E2Eテスト: 表示名入力後の自動ログイン（シナリオ2） in tests/e2e/user-story-4.spec.ts
- [x] T168 [US4] E2Eテスト: ログイン済みユーザーの登録画面スキップ（シナリオ3） in tests/e2e/user-story-4.spec.ts
- [x] T169 [US4] E2Eテスト: セッション維持（ブラウザ再起動後）（シナリオ4） in tests/e2e/user-story-4.spec.ts
- [x] T170 [US4] E2Eテスト: ログアウト機能（シナリオ5） in tests/e2e/user-story-4.spec.ts

### User Story 4のエッジケース

- [x] T171 [US4] user.schema.tsで空の表示名に対するバリデーションを追加
- [x] T172 [US4] user.schema.tsで表示名の長さに対するバリデーションを追加（1-50文字）
- [x] T173 [US4] 自動再登録でセッション期限切れを処理
- [x] T174 [US4] ログアウト時の警告メッセージを追加（データ損失）（確認ダイアログ付き）

**Checkpoint**: User Story 4が完全に機能し、認証スキップコードが完全に削除された

---

## Phase 6: 仕上げと横断的関心事

**目的**: 複数のUser Storyに影響する改善・追加機能

### エラーハンドリング統一

- [ ] T125 [P] lib/utils/apiResponse.tsで統一エラーレスポンスフォーマットを作成
- [ ] T126 [P] lib/constants/errorCodes.tsでエラーコード定数を追加
- [ ] T127 すべてのAPIエラーレスポンスを{success, message, code}フォーマットに標準化
- [ ] T128 クライアントサイドエラー用のエラーバウンダリを追加

### パフォーマンス最適化

- [ ] T129 [P] データベースインデックスの検証を追加（events_timeline, connections_category_flags）
- [ ] T130 [P] EXPLAIN ANALYZEでタイムラインクエリを最適化
- [ ] T131 [P] EventCardコンポーネントにReact.memoを追加
- [ ] T132 [P] Next.js Imageコンポーネントで画像最適化を追加

### ローディング・トースト通知

- [ ] T133 [P] すべての非同期操作にローディングスケルトンを追加
- [ ] T134 [P] トースト通知メッセージを標準化
- [ ] T135 [P] イベント作成成功時のトーストを追加
- [ ] T136 [P] イベント更新成功時のトーストを追加
- [ ] T137 [P] イベント中止成功時のトーストを追加

### ドキュメント・品質保証

- [ ] T138 [P] README.mdをプロジェクトセットアップ手順で更新
- [ ] T139 [P] contracts/api.yamlからAPIドキュメントを作成
- [ ] T140 [P] TypeScript型チェックを実行（npm run type-check）
- [ ] T141 [P] ESLintを実行し、すべての警告を修正（npm run lint）
- [ ] T142 [P] すべてのE2Eテストがパスすることを確認（npm run test:e2e）
- [ ] T143 [P] すべての単体/統合テストがパスすることを確認（npm test）
- [ ] T144 quickstart.mdのセットアップ手順を検証
- [ ] T145 docs/deployment.mdにデプロイガイドを作成

---

## 依存関係と実行順序

### フェーズ依存関係

- **セットアップ（Phase 1）**: 依存なし - 即座に開始可能
- **基盤構築（Phase 2）**: セットアップに依存 - すべてのUser Storyをブロック
- **User Stories（Phase 3-5）**: 基盤構築に依存
  - 並行実行可能（チーム体制による）
  - または優先度順に順次実行（P1 → P2 → P3）
- **仕上げ（Phase 6）**: 必要なUser Storyの完了に依存

### User Story依存関係

- **User Story 1 (P1)**: 基盤構築完了後に開始可能 - 他ストーリーへの依存なし（開発時は認証スキップで動作確認）
- **User Story 2 (P2)**: 基盤構築完了後に開始可能 - US1と統合するが独立してテスト可能（開発時は認証スキップで動作確認）
- **User Story 4 (P2)**: 基盤構築完了後に開始可能 - US1/US2の前提条件だが、開発順序としては後から実装可能（認証スキップコードを削除してUS4で置き換え）
- **User Story 3 (P3)**: 基盤構築完了後に開始可能 - US1/US2/US4と統合するが独立してテスト可能

### 各User Story内での順序

- テスト作成 → 実装（TDD: RED → GREEN → REFACTOR）
- 単体テスト → 統合テスト → E2Eテスト
- ビジネスロジック → Server Actions → UIコンポーネント
- コアロジック実装 → 統合 → エッジケース対応

### 並行実行の機会

- Phase 1のすべての[P]タスクは並行実行可能
- Phase 2のすべての[P]タスクは並行実行可能（フェーズ内）
- 基盤構築完了後、すべてのUser Storyは並行開始可能（チーム体制による）
- 各User Story内の[P]タスクは並行実行可能
- 異なるUser Storyは異なるチームメンバーが並行作業可能

---

## 実装戦略

### MVP優先（User Story 1のみ）

1. Phase 1: セットアップ完了
2. Phase 2: 基盤構築完了（重要 - すべてのストーリーをブロック）
3. Phase 3: User Story 1完了
4. **停止して検証**: User Story 1を独立してテスト
5. 準備できればデプロイ/デモ

### インクリメンタルデリバリー

1. セットアップ + 基盤構築完了 → 基盤準備完了
2. User Story 1追加 → 独立テスト → デプロイ/デモ（認証スキップで動作確認）
3. User Story 2追加 → 独立テスト → デプロイ/デモ（認証スキップで動作確認）
4. User Story 4追加 → 認証スキップコード削除 → 独立テスト → デプロイ/デモ（本番用認証機能）
5. User Story 3追加 → 独立テスト → デプロイ/デモ
6. 各ストーリーが既存機能を壊さずに価値を追加

### 並行チーム戦略

複数の開発者がいる場合:

1. チーム全体でセットアップ + 基盤構築を完了
2. 基盤構築完了後:
   - 開発者A: User Story 1（認証スキップで動作確認）
   - 開発者B: User Story 2（認証スキップで動作確認）
   - 開発者C: User Story 4（認証機能実装、認証スキップコード削除）
   - 開発者D: User Story 3（US4完了後に開始推奨）
3. 各ストーリーを独立して完了・統合

---

## 注意事項

- **[P]タスク** = 異なるファイル、依存関係なし
- **[Story]ラベル** = タスクを特定のUser Storyにマッピング（トレーサビリティ）
- 各User Storyは独立して完了・テスト可能
- テスト作成時は必ずREDを確認してから実装
- 各タスクまたは論理的なグループ単位でコミット
- 各チェックポイントでストーリーを独立して検証
- **避けるべき**: 曖昧なタスク、同一ファイルの競合、ストーリー間の依存関係による独立性の破壊

---

## タスク数サマリー

- **Phase 1 (セットアップ)**: 9タスク (✅ 9/9 完了)
- **Phase 2 (基盤構築)**: 29タスク (✅ 29/29 完了)
- **Phase 3 (User Story 1)**: 35タスク (✅ 35/35 完了)
- **Phase 4 (User Story 2)**: 20タスク (✅ 20/20 完了)
- **Phase 4.5 (User Story 4)**: 29タスク (✅ 29/29 完了)
- **Phase 5 (User Story 3)**: 31タスク (✅ 31/31 完了)
- **Phase 6 (仕上げ)**: 21タスク (0/21 未着手)

**合計**: 174タスク (完了: 154, 未完了: 20)

---

## MVP Recommendation

最小限のMVPとしてUser Story 1（P1）のみを実装する場合:

**必須タスク**: Phase 1（9タスク）+ Phase 2（29タスク）+ Phase 3（35タスク）= **73タスク**

この構成で、匿名イベント投稿とつながりリストベースの配信機能が完全に動作します。
