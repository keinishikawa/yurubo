# Data Model: つながり管理（Connections）

**Feature**: Epic 000 - つながり管理
**Date**: 2025-12-03
**Spec**: [spec.md](./spec.md)

## 1. エンティティ概要

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│     users       │     │ connection_requests  │     │   connections   │
│  (既存テーブル)  │────→│    (新規テーブル)     │────→│  (既存テーブル)  │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
        │                         │                         │
        │                         ↓                         │
        │               ┌─────────────────┐                 │
        └──────────────→│  notifications  │←────────────────┘
                        │  (新規テーブル)  │
                        └─────────────────┘
                                  │
                                  ↓
                        ┌─────────────────┐
                        │   categories    │
                        │  (既存テーブル)  │
                        └─────────────────┘
```

## 2. 既存テーブル（参照のみ）

### 2.1 users（ユーザー）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | Supabase Auth UUIDと一致 |
| display_name | TEXT | 表示名（検索対象） |
| avatar_url | TEXT | プロフィール画像URL |
| bio | TEXT | 自己紹介 |
| enabled_categories | TEXT[] | 有効カテゴリ（デフォルト: 全カテゴリ） |
| notification_preferences | JSONB | 通知設定 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**本Epicでの利用**:
- ユーザー検索（display_name, id）
- カテゴリ設定画面でenabled_categoriesを参照

### 2.2 connections（つながりリスト）

| カラム | 型 | 説明 |
|--------|-----|------|
| user_id | UUID (PK, FK) | つながりの所有者 |
| target_id | UUID (PK, FK) | つながり相手 |
| category_flags | JSONB | カテゴリ別OK/NGフラグ |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**category_flagsの構造**:
```json
{
  "drinking": false,
  "travel": false,
  "tennis": false,
  "other": false
}
```

**制約**:
- `CHECK (user_id != target_id)` - 自分自身へのつながり禁止
- 複合主キー `(user_id, target_id)`

### 2.3 categories（カテゴリマスタ）

| カラム | 型 | 説明 |
|--------|-----|------|
| value | TEXT (PK) | 内部識別子（drinking, travel, tennis, other） |
| label | TEXT | 日本語表示名 |
| emoji | TEXT | カテゴリ絵文字 |
| display_order | INTEGER | 表示順序 |
| created_at | TIMESTAMPTZ | 作成日時 |

## 3. 新規テーブル

### 3.1 connection_requests（つながりリクエスト）

つながり成立前の申請状態を管理するテーブル。

| カラム | 型 | 説明 | 制約 |
|--------|-----|------|------|
| id | UUID (PK) | リクエストID | DEFAULT gen_random_uuid() |
| sender_id | UUID (FK) | リクエスト送信者 | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |
| receiver_id | UUID (FK) | リクエスト受信者 | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |
| message | TEXT | 任意メッセージ | DEFAULT NULL |
| expires_at | TIMESTAMPTZ | 有効期限 | NOT NULL, DEFAULT NOW() + INTERVAL '7 days' |
| created_at | TIMESTAMPTZ | 作成日時 | NOT NULL, DEFAULT NOW() |

**制約**:
- `CHECK (sender_id != receiver_id)` - 自分自身へのリクエスト禁止
- `UNIQUE (sender_id, receiver_id)` - 同一相手への重複リクエスト禁止

**インデックス**:
- `idx_connection_requests_sender_id ON connection_requests(sender_id)`
- `idx_connection_requests_receiver_id ON connection_requests(receiver_id)`
- `idx_connection_requests_expires_at ON connection_requests(expires_at)`

**RLSポリシー**:
- SELECT: 自分が送信者または受信者のリクエストのみ閲覧可
- INSERT: 認証済みユーザーのみ、sender_id = auth.uid()の場合のみ
- DELETE: 自分が送信者または受信者の場合のみ（承認/拒否時に使用）

### 3.2 notifications（通知）

アプリ内通知を管理するテーブル。

| カラム | 型 | 説明 | 制約 |
|--------|-----|------|------|
| id | UUID (PK) | 通知ID | DEFAULT gen_random_uuid() |
| user_id | UUID (FK) | 通知対象ユーザー | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |
| type | TEXT | 通知タイプ | NOT NULL |
| title | TEXT | 通知タイトル | NOT NULL |
| body | TEXT | 通知本文 | NOT NULL |
| data | JSONB | 追加データ（リンク先等） | DEFAULT '{}' |
| is_read | BOOLEAN | 既読フラグ | NOT NULL, DEFAULT false |
| created_at | TIMESTAMPTZ | 作成日時 | NOT NULL, DEFAULT NOW() |

**通知タイプ（type）**:
- `connection_request` - つながりリクエスト受信
- `connection_accepted` - つながりリクエスト承認

**dataの構造例**:
```json
{
  "request_id": "uuid",
  "sender_id": "uuid",
  "sender_name": "表示名",
  "link": "/connections/requests"
}
```

**インデックス**:
- `idx_notifications_user_id ON notifications(user_id)`
- `idx_notifications_is_read ON notifications(user_id, is_read)`
- `idx_notifications_created_at ON notifications(created_at DESC)`

**RLSポリシー**:
- SELECT: 自分の通知のみ閲覧可 `(user_id = auth.uid())`
- UPDATE: 自分の通知のみ更新可（既読更新用）
- DELETE: 自分の通知のみ削除可

## 4. 状態遷移

### 4.1 つながりリクエストのライフサイクル

```
[リクエスト送信]
       │
       ↓
┌─────────────┐
│   pending   │ ← connection_requestsテーブルにレコード作成
└─────────────┘
       │
       ├──────────────┬──────────────┐
       ↓              ↓              ↓
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  approved   │ │  rejected   │ │   expired   │
│ (つながり成立)│ │ (拒否)      │ │ (期限切れ)   │
└─────────────┘ └─────────────┘ └─────────────┘
       │              │              │
       ↓              ↓              ↓
connections      リクエスト削除    リクエスト削除
テーブルに       (通知なし)       (自動)
双方向レコード作成
```

### 4.2 同時リクエスト処理

AからBへ、BからAへ同時にリクエストがある場合：

1. 後からリクエストを送信した側で検出
2. 既存リクエストを削除
3. 即座にconnectionsテーブルに双方向レコードを作成
4. 両者に「つながり成立」通知を送信

## 5. バリデーションルール

### 5.1 つながりリクエスト送信

| ルール | エラーコード |
|--------|--------------|
| 自分自身へのリクエスト禁止 | SELF_REQUEST_NOT_ALLOWED |
| 既にpending状態のリクエストがある | REQUEST_ALREADY_PENDING |
| 既につながりがある | ALREADY_CONNECTED |
| 受信者が存在しない | USER_NOT_FOUND |

### 5.2 カテゴリ設定

| ルール | エラーコード |
|--------|--------------|
| 自分のenabled_categoriesに含まれないカテゴリは設定不可 | CATEGORY_NOT_ENABLED |
| つながりが存在しない | CONNECTION_NOT_FOUND |

## 6. マイグレーション計画

### 6.1 新規マイグレーションファイル

1. `20251203000001_create_connection_requests_table.sql`
2. `20251203000002_create_notifications_table.sql`

### 6.2 既存テーブルへの影響

- connections: 変更なし
- users: 変更なし
- categories: 変更なし
