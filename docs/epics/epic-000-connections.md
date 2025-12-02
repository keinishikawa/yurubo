# Epic 000: つながり管理（Connections）

## 概要

**目的**
ユーザー間の関係性を「アクティビティ単位」で管理し、イベント配信範囲を適切に制御する基盤機能。

**ユーザー価値**
- 「この人とは飲みOK、でも旅行はNG」といった柔軟な関係設定
- 興味のないカテゴリのイベント通知を受けない
- プライバシーとつながりのバランスを自分でコントロール

**依存関係**
- なし（最優先基盤機能）

**このエピックがブロックするもの**
- Epic 001: イベント作成（配信先の決定に必要）
- Epic 002: 参加・承認（可視範囲の制御に必要）
- Epic 007: マジックインビテーション（つながり自動作成に必要）

---

## User Stories

### US1: つながりの追加
**As a** ユーザー
**I want to** 友人を「つながり」として追加できる
**So that** その人とイベントで繋がれるようになる

**AC（Acceptance Criteria）**
- [ ] 友人検索UI（ユーザー名・ID検索）
- [ ] つながりリクエスト送信機能
- [ ] 相手の承認で双方向につながり成立
- [ ] つながりリストの表示

---

### US2: アクティビティ単位の関係設定
**As a** ユーザー
**I want to** つながりごとにカテゴリ（飲み・旅行・スポーツ等）を設定できる
**So that** 特定のアクティビティだけ一緒に参加できる関係を作れる

**AC（Acceptance Criteria）**
- [ ] つながり編集UI（カテゴリチェックボックス）
- [ ] カテゴリ別フラグの保存（jsonb）
- [ ] 双方向の設定（AさんがBさんを飲みOKにしても、BさんがAさんを飲みNGなら配信されない）
- [ ] デフォルト設定（新規つながりは全カテゴリOFF）

---

### US3: つながりリストの閲覧・管理
**As a** ユーザー
**I want to** 自分のつながりリストを一覧で見られる
**So that** 誰とどのアクティビティで繋がっているか把握できる

**AC（Acceptance Criteria）**
- [ ] つながり一覧ページ（`/connections`）
- [ ] カテゴリ別フィルタ（飲み友達のみ表示、など）
- [ ] つながり削除機能（ソフトデリート or 完全削除）
- [ ] 検索機能（名前・カテゴリで絞り込み）

---

### US4: つながりリクエストの承認・拒否
**As a** ユーザー
**I want to** つながりリクエストを承認または拒否できる
**So that** 望まない相手とつながらずに済む

**AC（Acceptance Criteria）**
- [ ] リクエスト受信通知
- [ ] リクエスト一覧表示（pending状態）
- [ ] 承認ボタン → connections作成
- [ ] 拒否ボタン → リクエスト削除（通知なし）
- [ ] 無反応時の自動期限切れ（7日後）

---

### US5: イベント配信フィルタリング（バックエンド）
**As a** システム
**I want to** イベント投稿時に該当カテゴリがOKなつながりのみに配信する
**So that** ユーザーが関係ないイベントを見なくて済む

**AC（Acceptance Criteria）**
- [ ] イベント作成時に`connections`テーブルをクエリ
- [ ] 投稿者のつながりリスト × 該当カテゴリフラグで配信先決定
- [ ] 双方向チェック（AとBが両方OKの場合のみ配信）
- [ ] パフォーマンス最適化（インデックス、キャッシュ）

---

## 技術仕様

### DBテーブル設計

#### `connections` テーブル
| カラム           | 型      | 説明                                      |
| ---------------- | ------- | ----------------------------------------- |
| `id`             | uuid    | 主キー                                    |
| `user_id`        | uuid    | ユーザーA（外部キー: users.id）          |
| `target_id`      | uuid    | ユーザーB（外部キー: users.id）          |
| `category_flags` | jsonb   | `{"drinking": true, "travel": false, ...}`|
| `status`         | enum    | `pending`, `active`, `blocked`            |
| `created_at`     | timestamp | 作成日時                                |
| `updated_at`     | timestamp | 更新日時                                |

**制約**
- `(user_id, target_id)` のユニーク制約
- `user_id != target_id` チェック制約

**インデックス**
```sql
CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_target_id ON connections(target_id);
CREATE INDEX idx_connections_status ON connections(status);
```

---

#### `connection_requests` テーブル
| カラム       | 型        | 説明                              |
| ------------ | --------- | --------------------------------- |
| `id`         | uuid      | 主キー                            |
| `from_id`    | uuid      | リクエスト送信者                  |
| `to_id`      | uuid      | リクエスト受信者                  |
| `message`    | text      | 任意のメッセージ                  |
| `status`     | enum      | `pending`, `accepted`, `rejected` |
| `expires_at` | timestamp | 有効期限（7日後）                 |
| `created_at` | timestamp | 作成日時                          |

---

### API設計

#### `GET /api/connections`
**レスポンス**
```json
{
  "connections": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "田中太郎",
        "anon_id": "🍶A"
      },
      "category_flags": {
        "drinking": true,
        "travel": false,
        "sports": true
      },
      "created_at": "2025-12-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/connections/request`
**リクエスト**
```json
{
  "target_user_id": "uuid",
  "message": "よろしくお願いします！"
}
```

#### `PATCH /api/connections/:id`
**リクエスト**
```json
{
  "category_flags": {
    "drinking": true,
    "travel": true
  }
}
```

#### `DELETE /api/connections/:id`
つながり削除（ソフトデリート）

---

### UI設計

#### `/connections` ページ
- **ヘッダー**: 「つながり」タイトル + 検索ボックス
- **タブ**: 全て / リクエスト中 / カテゴリ別
- **カード形式**:
  - ユーザー名
  - カテゴリバッジ（🍶飲み、✈️旅行、⚽スポーツ）
  - 編集ボタン
  - 削除ボタン

#### つながり編集モーダル
- カテゴリチェックボックスリスト
- 保存 / キャンセルボタン

#### つながりリクエストモーダル
- ユーザー検索（名前・ID）
- メッセージ入力（任意）
- 送信ボタン

---

### RLS（Row-Level Security）

```sql
-- ユーザーは自分のつながりのみ閲覧可能
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = target_id);

-- ユーザーは自分のつながりのみ更新可能
CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  USING (auth.uid() = user_id);

-- つながりリクエストは受信者のみ閲覧可能
CREATE POLICY "Users can view received requests"
  ON connection_requests FOR SELECT
  USING (auth.uid() = to_id);
```

---

## E2Eテスト戦略

### テストシナリオ

#### TC1: つながりリクエスト送信から承認まで
```typescript
test("つながりリクエストを送信し、相手が承認するとつながりが成立する", async ({ page, context }) => {
  // 1. ユーザーAがログイン → ユーザーB検索 → リクエスト送信
  // 2. 別コンテキストでユーザーBがログイン → リクエスト承認
  // 3. connectionsテーブルに双方向レコードが作成されていることを確認
});
```

#### TC2: カテゴリ設定とイベント配信フィルタリング
```typescript
test("カテゴリ設定に応じてイベントが配信される", async ({ page }) => {
  // 1. ユーザーAとBがつながり（飲みOK、旅行NG）
  // 2. ユーザーAが飲みイベント投稿 → ユーザーBのタイムラインに表示
  // 3. ユーザーAが旅行イベント投稿 → ユーザーBのタイムラインに非表示
});
```

#### TC3: つながり削除
```typescript
test("つながりを削除すると相手のイベントが見えなくなる", async ({ page }) => {
  // 1. つながりを削除
  // 2. 相手の新規投稿が自分のタイムラインに表示されないことを確認
});
```

---

## 完了の定義（DoD）

- [ ] 全User StoriesのACを満たす
- [ ] E2Eテストがパス（上記TC1〜3）
- [ ] Unit/Integrationテストがパス
- [ ] `npm run lint` & `npm run type-check` がパス
- [ ] PR作成済み（レビュー承認）
- [ ] CI全チェック通過
- [ ] ドキュメント更新（README、API仕様）

---

## 関連エピック

- **次のエピック**: Epic 001（イベント作成）
- **ブロックされる側**: Epic 002（参加・承認）, Epic 007（マジックインビテーション）

---

## 参考資料

- [firstspec.md](../firstspec.md) - Phase 1「利用対象（マッチ範囲）」セクション
- [techplan.md](../techplan.md) - connectionsテーブル設計

---

**作成日**: 2025-12-02
**ステータス**: Draft
**優先度**: P0（最優先・基盤機能）
