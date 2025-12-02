# Epic 001: イベント作成（Event Creation）

## 概要

**目的**
誰でも心理的抵抗なく「軽く誘う」ことができる、匿名投稿ベースのイベント作成機能。

**ユーザー価値**
- 「誰が来るか分からない」不安を軽減（匿名投稿）
- 気軽に誘える心理的安全性
- 自分のつながりの中で興味がある人にだけ届く

**依存関係**
- **前提**: Epic 000（つながり管理） - 配信先の決定に必要

**このエピックがブロックするもの**
- Epic 002: 参加・承認（イベントが存在して初めて成立）
- Epic 003: 店選定（確定したイベントに対して実施）
- Epic 004: チャット（イベント参加者間のコミュニケーション）

---

## User Stories

### US1: イベント投稿フォーム
**As a** ユーザー
**I want to** 簡単なフォームでイベントを投稿できる
**So that** 友人を気軽に誘える

**AC（Acceptance Criteria）**
- [ ] ホーム右下に「＋投稿」ボタン（floating）
- [ ] モーダル形式の入力フォーム
- [ ] 必須項目: カテゴリ、開催日時（開始・終了）
- [ ] 任意項目: 受付締切日時、想定人数、価格帯、短文コメント
- [ ] バリデーション: 開始 < 終了、締切 < 開始
- [ ] 投稿完了後、タイムラインに即時反映

**入力項目詳細**
| 項目             | 形式                             | 例                          |
| ---------------- | -------------------------------- | --------------------------- |
| カテゴリ         | セレクトボックス                 | 飲み、旅行、スポーツ、その他 |
| 開催日時（開始） | DateTimePicker                   | 2025-12-05 19:00            |
| 開催日時（終了） | DateTimePicker                   | 2025-12-05 22:00            |
| 受付締切日時     | DateTimePicker（任意）           | 2025-12-04 18:00            |
| 想定人数         | レンジスライダー（例: 2〜6人）   | 2〜6                        |
| 価格帯           | セレクトボックス（任意）         | 3000〜5000円                |
| コメント         | テキストエリア（任意、100文字）  | 新宿で軽く飲みませんか      |

---

### US2: 匿名タイムライン表示
**As a** ユーザー
**I want to** 自分のつながりが投稿したイベントを匿名で見られる
**So that** 誰が誘ったか気にせず参加を判断できる

**AC（Acceptance Criteria）**
- [ ] `/` ルートでタイムライン表示
- [ ] 投稿者名は非表示（匿名）
- [ ] カテゴリアイコン表示（🍶飲み、✈️旅行など）
- [ ] 開催日時、人数、価格帯、コメントを表示
- [ ] フィルタ機能（今日／今後／全体）
- [ ] カテゴリ絞り込み
- [ ] 自分のつながり × 該当カテゴリOKのイベントのみ表示

**カード表示項目**
```
┌─────────────────────────┐
│ 🍶 飲み                 │ ← カテゴリアイコン
│                         │
│ 12/5 (木) 19:00〜22:00  │ ← 開催日時
│ 2〜6人 / 3000〜5000円   │ ← 人数・価格帯
│ 新宿で軽く飲みませんか  │ ← コメント
│                         │
│ [参加したい]            │ ← アクションボタン
└─────────────────────────┘
```

---

### US3: マイイベントページ
**As a** ユーザー
**I want to** 自分が投稿または参加しているイベントを一覧で見られる
**So that** 予定を管理できる

**AC（Acceptance Criteria）**
- [ ] `/my` ページで自分のイベント一覧
- [ ] タブ切り替え: 幹事 👑 / 参加中 / 過去
- [ ] 幹事イベント: 参加者数、承認待ち人数を表示
- [ ] 参加イベント: 承認状態（pending / confirmed）を表示
- [ ] イベントカードタップ → 詳細ページ遷移
- [ ] 幹事イベントには「募集管理」ボタン表示

**既存Issue**: #34 がこのUS3に該当

---

### US4: イベント編集・削除
**As a** イベント投稿者
**I want to** 自分が投稿したイベントを編集・削除できる
**So that** 予定変更や中止に対応できる

**AC（Acceptance Criteria）**
- [ ] 投稿者のみ編集・削除可能
- [ ] 編集: 日時・人数・価格帯・コメントを変更可能
- [ ] 編集時、参加者全員に通知
- [ ] 削除: 確認モーダル → 参加者全員に中止通知
- [ ] 参加者がいる場合、削除時に警告表示

---

### US5: 配信フィルタリング（バックエンド）
**As a** システム
**I want to** イベント投稿時につながりリストを基に配信先を決定する
**So that** ユーザーが関係ないイベントを見なくて済む

**AC（Acceptance Criteria）**
- [ ] `connections`テーブルをクエリ
- [ ] 投稿者のつながり × 該当カテゴリフラグで配信先決定
- [ ] 双方向チェック（両者がOKの場合のみ配信）
- [ ] 投稿数制限: 同カテゴリ最大3件/日
- [ ] RLSでタイムライン表示を制御

---

## 技術仕様

### DBテーブル設計

#### `events` テーブル
| カラム          | 型        | 説明                               |
| --------------- | --------- | ---------------------------------- |
| `id`            | uuid      | 主キー                             |
| `creator_id`    | uuid      | 投稿者（外部キー: users.id）      |
| `category`      | enum      | `drinking`, `travel`, `sports`, etc|
| `date_start`    | timestamp | 開催開始日時                       |
| `date_end`      | timestamp | 開催終了日時                       |
| `deadline`      | timestamp | 受付締切日時（nullable）           |
| `capacity_min`  | int       | 最小人数                           |
| `capacity_max`  | int       | 最大人数                           |
| `price_range`   | text      | 価格帯（例: "3000-5000"）          |
| `comment`       | text      | コメント（100文字以内）            |
| `host_id`       | uuid      | 幹事ID（最初の参加者が自動設定）   |
| `status`        | enum      | `open`, `closed`, `cancelled`      |
| `created_at`    | timestamp | 作成日時                           |
| `updated_at`    | timestamp | 更新日時                           |

**インデックス**
```sql
CREATE INDEX idx_events_creator_id ON events(creator_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_date_start ON events(date_start);
CREATE INDEX idx_events_status ON events(status);
```

---

### API設計

#### `POST /api/events`
**リクエスト**
```json
{
  "category": "drinking",
  "date_start": "2025-12-05T19:00:00Z",
  "date_end": "2025-12-05T22:00:00Z",
  "deadline": "2025-12-04T18:00:00Z",
  "capacity_min": 2,
  "capacity_max": 6,
  "price_range": "3000-5000",
  "comment": "新宿で軽く飲みませんか"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "イベントを作成しました",
  "data": {
    "event_id": "uuid",
    "created_at": "2025-12-02T10:00:00Z"
  }
}
```

#### `GET /api/events`
**クエリパラメータ**
- `filter`: `today`, `upcoming`, `all`
- `category`: `drinking`, `travel`, etc

**レスポンス**
```json
{
  "events": [
    {
      "id": "uuid",
      "category": "drinking",
      "date_start": "2025-12-05T19:00:00Z",
      "date_end": "2025-12-05T22:00:00Z",
      "capacity_min": 2,
      "capacity_max": 6,
      "price_range": "3000-5000",
      "comment": "新宿で軽く飲みませんか",
      "participant_count": 3,
      "is_host": false,
      "created_at": "2025-12-02T10:00:00Z"
    }
  ]
}
```

#### `PATCH /api/events/:id`
イベント編集（投稿者のみ）

#### `DELETE /api/events/:id`
イベント削除（投稿者のみ）

---

### RLS（Row-Level Security）

```sql
-- タイムライン表示: つながり × カテゴリフラグで制御
CREATE POLICY "Users can view events from connections"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE (user_id = auth.uid() AND target_id = events.creator_id)
        AND category_flags->>events.category = 'true'
        AND status = 'active'
    )
  );

-- 投稿者は自分のイベントを編集・削除可能
CREATE POLICY "Creators can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = creator_id);
```

---

## E2Eテスト戦略

### テストシナリオ

#### TC1: イベント投稿から表示まで
```typescript
test("イベントを投稿するとつながりのタイムラインに表示される", async ({ page, context }) => {
  // 1. ユーザーAがイベント投稿（カテゴリ: 飲み）
  // 2. 別コンテキストでユーザーBがログイン（AとBは飲み友達）
  // 3. ユーザーBのタイムラインにAのイベントが表示される
});
```

#### TC2: カテゴリフィルタリング
```typescript
test("カテゴリ設定に応じてイベントが配信される", async ({ page }) => {
  // 1. ユーザーAとBがつながり（飲みOK、旅行NG）
  // 2. ユーザーAが旅行イベント投稿
  // 3. ユーザーBのタイムラインに表示されないことを確認
});
```

#### TC3: マイイベントページ
```typescript
test("自分が投稿したイベントがマイページに表示される", async ({ page }) => {
  // 1. イベント投稿
  // 2. /myページに遷移
  // 3. 幹事タブに投稿イベントが表示される
});
```

#### TC4: イベント編集
```typescript
test("イベントを編集すると変更が反映される", async ({ page }) => {
  // 1. イベント投稿
  // 2. 編集モーダルで日時変更
  // 3. タイムラインで変更後の内容が表示される
});
```

---

## 完了の定義（DoD）

- [ ] 全User StoriesのACを満たす
- [ ] E2Eテストがパス（上記TC1〜4）
- [ ] Unit/Integrationテストがパス
- [ ] `npm run lint` & `npm run type-check` がパス
- [ ] PR作成済み（レビュー承認）
- [ ] CI全チェック通過
- [ ] ドキュメント更新（README、API仕様）

---

## 実装状況

**Status**: ✅ 実装済み（一部）

**完了済み**
- US1: イベント投稿フォーム（基本実装完了）
- US2: タイムライン表示（基本実装完了）

**未完了**
- US3: マイイベントページ（Issue #34で対応中）
- US4: イベント編集・削除
- US5: 配信フィルタリング（つながり管理実装後）

---

## 関連エピック

- **前提**: Epic 000（つながり管理）
- **次のエピック**: Epic 002（参加・承認）

---

## 参考資料

- [firstspec.md](../firstspec.md) - Phase 1「投稿（誘い作成）」セクション
- [techplan.md](../techplan.md) - eventsテーブル設計

---

**作成日**: 2025-12-02
**ステータス**: In Progress（一部実装済み）
**優先度**: P1（基盤機能の次）
