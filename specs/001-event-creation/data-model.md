# Data Model: フェーズ1：イベント作成機能

**Feature Branch**: `001-event-creation`
**Created**: 2025-11-11
**Status**: Draft

このドキュメントは、イベント作成機能で使用するデータモデル定義を記述します。すべてのテーブルはSupabase PostgreSQLで実装されます。

---

## 1. エンティティ概要

| エンティティ | 説明 | 主要な用途 |
|------------|------|-----------|
| users | ユーザー情報 | 認証、プロフィール、有効カテゴリ管理 |
| events | イベント情報 | イベント作成、タイムライン表示、編集 |
| connections | つながりリスト | カテゴリ単位のつながり管理、配信制御 |
| categories | カテゴリマスタ | イベントカテゴリの定義 |

---

## 2. テーブル定義

### 2.1 users（ユーザー）

ユーザーの基本情報と設定を管理します。Supabase Authの`auth.users`を拡張するプロファイルテーブルです。

```sql
CREATE TABLE users (
  -- 主キー（Supabase Auth UUIDと一致）
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基本情報
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,

  -- 有効カテゴリ（つながりリスト初期状態で使用）
  enabled_categories TEXT[] NOT NULL DEFAULT ARRAY['drinking', 'travel', 'tennis', 'other'],

  -- 通知設定
  notification_preferences JSONB NOT NULL DEFAULT '{
    "event_invitation": true,
    "event_update": true,
    "event_cancellation": true,
    "participant_confirmed": true
  }'::jsonb,

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_users_display_name ON users(display_name);
```

**フィールド説明**:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| id | UUID | ✅ | - | ユーザーID（Supabase Auth連携） |
| display_name | TEXT | ✅ | - | 表示名（実名または仮名） |
| avatar_url | TEXT | ❌ | NULL | プロフィール画像URL |
| bio | TEXT | ❌ | NULL | 自己紹介 |
| enabled_categories | TEXT[] | ✅ | 全カテゴリ | ユーザーが有効にしているカテゴリのリスト |
| notification_preferences | JSONB | ✅ | 全ON | 通知設定（カテゴリごとのON/OFF） |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | ✅ | NOW() | 更新日時 |

**バリデーションルール**:
- `display_name`: 1〜50文字
- `bio`: 0〜500文字
- `enabled_categories`: 配列内の値は`categories`テーブルのvalueと一致する必要あり

---

### 2.2 events（イベント）

ユーザーが作成するイベント情報を管理します。

```sql
CREATE TABLE events (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本情報
  category TEXT NOT NULL REFERENCES categories(value) ON DELETE RESTRICT,
  title TEXT NOT NULL, -- 自動生成または手動入力
  anon_id TEXT NOT NULL, -- 匿名ID（例: 🍶A）

  -- 開催情報
  date_start TIMESTAMPTZ NOT NULL,
  date_end TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ, -- 受付締切日時（任意）

  -- 人数情報
  capacity_min INTEGER NOT NULL CHECK (capacity_min >= 1),
  capacity_max INTEGER NOT NULL CHECK (capacity_max >= capacity_min),

  -- 価格情報
  price_min INTEGER CHECK (price_min >= 0),
  price_max INTEGER CHECK (price_max >= price_min),

  -- コメント
  comment TEXT,

  -- 投稿者情報
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- ステータス
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (status IN (
    'recruiting',  -- 募集中
    'confirmed',   -- 参加者承認済み
    'completed',   -- 開催済み
    'cancelled'    -- 中止
  )),

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_date_start ON events(date_start);

-- 複合インデックス（タイムラインクエリ最適化）
CREATE INDEX idx_events_timeline ON events(status, created_at DESC)
  WHERE status = 'recruiting';
```

**フィールド説明**:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| id | UUID | ✅ | 自動生成 | イベントID |
| category | TEXT | ✅ | - | カテゴリ（drinking/travel/tennis/other） |
| title | TEXT | ✅ | - | イベントタイトル（例: 「軽く飲みませんか?」） |
| anon_id | TEXT | ✅ | - | 匿名ID（例: 🍶A） |
| date_start | TIMESTAMPTZ | ✅ | - | 開催開始日時 |
| date_end | TIMESTAMPTZ | ✅ | - | 開催終了日時 |
| deadline | TIMESTAMPTZ | ❌ | NULL | 受付締切日時 |
| capacity_min | INTEGER | ✅ | - | 想定最小人数 |
| capacity_max | INTEGER | ✅ | - | 想定最大人数 |
| price_min | INTEGER | ❌ | NULL | 価格帯（最小） |
| price_max | INTEGER | ❌ | NULL | 価格帯（最大） |
| comment | TEXT | ❌ | NULL | コメント |
| host_id | UUID | ✅ | - | 投稿者（仮幹事）のユーザーID |
| status | TEXT | ✅ | recruiting | イベントステータス |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | ✅ | NOW() | 更新日時 |

**バリデーションルール**（spec.md FR-015に基づく）:
- `category`: 必須、`categories`テーブルのvalueと一致
- `date_start`: 必須、現在時刻より未来
- `date_end`: 必須、`date_start`より後
- `capacity_min`: 必須、1以上
- `capacity_max`: 必須、`capacity_min`以上
- `price_min`: 任意、0以上
- `price_max`: 任意、`price_min`以上
- `deadline`: 任意、入力時は`date_start`より前
- `comment`: 任意、0〜500文字

**状態遷移**:
```
recruiting（募集中）
  ↓
  [参加者承認]
  ↓
confirmed（参加者承認済み）
  ↓
  [開催完了]
  ↓
completed（開催済み）

※ いずれの状態からでもcancelled（中止）へ遷移可能
```

---

### 2.3 connections（つながりリスト）

ユーザー間のつながりとカテゴリ単位の配信許可を管理します。

```sql
CREATE TABLE connections (
  -- 複合主キー
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- カテゴリ単位のフラグ（JSONB型）
  category_flags JSONB NOT NULL DEFAULT '{
    "drinking": false,
    "travel": false,
    "tennis": false,
    "other": false
  }'::jsonb,

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, target_id),
  CHECK (user_id != target_id) -- 自分自身へのつながりを禁止
);

-- インデックス
CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_target_id ON connections(target_id);
CREATE INDEX idx_connections_category_flags ON connections USING GIN (category_flags);
```

**フィールド説明**:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| user_id | UUID | ✅ | - | つながりを設定したユーザーID |
| target_id | UUID | ✅ | - | つながり対象のユーザーID |
| category_flags | JSONB | ✅ | 全てfalse | カテゴリごとのOK/NGフラグ |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | ✅ | NOW() | 更新日時 |

**category_flagsスキーマ**:
```json
{
  "drinking": true,  // 飲みカテゴリOK
  "travel": false,   // 旅行カテゴリNG
  "tennis": true,    // テニスカテゴリOK
  "other": false     // その他カテゴリNG
}
```

**初期状態ルール**（spec.md Clarificationsに基づく）:
- つながり追加時、`user_id`の`enabled_categories`に含まれるカテゴリをデフォルトでtrueに設定
- 例: ユーザーAが飲み・テニスを有効にしている場合、`{"drinking": true, "travel": false, "tennis": true, "other": false}`

**バリデーションルール**:
- `user_id`と`target_id`は異なる値である必要あり
- `category_flags`のキーは`categories`テーブルのvalueと一致する必要あり

---

### 2.4 categories（カテゴリマスタ）

イベントカテゴリの定義を管理します。

```sql
CREATE TABLE categories (
  -- 主キー
  value TEXT PRIMARY KEY, -- 内部識別子（例: drinking）

  -- 表示情報
  label TEXT NOT NULL,    -- 日本語表示名（例: 飲み）
  emoji TEXT NOT NULL,    -- カテゴリ絵文字（例: 🍶）

  -- 表示順序
  display_order INTEGER NOT NULL DEFAULT 0,

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期データ挿入
INSERT INTO categories (value, label, emoji, display_order) VALUES
  ('drinking', '飲み', '🍶', 1),
  ('travel', '旅行', '✈️', 2),
  ('tennis', 'テニス', '🎾', 3),
  ('other', 'その他', '📌', 4);

-- インデックス
CREATE INDEX idx_categories_display_order ON categories(display_order);
```

**フィールド説明**:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| value | TEXT | ✅ | - | 内部識別子（例: drinking） |
| label | TEXT | ✅ | - | 日本語表示名（例: 飲み） |
| emoji | TEXT | ✅ | - | カテゴリ絵文字（例: 🍶） |
| display_order | INTEGER | ✅ | 0 | 表示順序（昇順） |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 作成日時 |

**初期カテゴリ**（spec.md FR-003に基づく）:
1. 飲み（🍶）
2. 旅行（✈️）
3. テニス（🎾）
4. その他（📌）

---

## 3. リレーションシップ

### 3.1 users ↔ events（1対多）
- 1人のユーザーは複数のイベントを作成可能
- 1つのイベントは1人の投稿者（host_id）を持つ

### 3.2 users ↔ connections（多対多）
- 1人のユーザーは複数のつながりを持つ
- つながりは双方向（AがBをつながりに追加 ≠ BがAをつながりに追加）

### 3.3 events ↔ categories（多対1）
- 1つのイベントは1つのカテゴリに属する
- 1つのカテゴリは複数のイベントを持つ

### 3.4 connections ↔ categories（JSON参照）
- `connections.category_flags`のキーは`categories.value`を参照

---

## 4. Row-Level Security (RLS) ポリシー

### 4.1 events テーブル

**SELECT ポリシー**: つながりリスト内のカテゴリOKユーザーのみ閲覧可

```sql
CREATE POLICY "events_select_policy" ON events
FOR SELECT USING (
  -- 自分の投稿は常に閲覧可
  host_id = auth.uid()
  OR
  -- つながりリスト内で該当カテゴリOKの投稿のみ閲覧可
  EXISTS (
    SELECT 1 FROM connections
    WHERE connections.user_id = events.host_id
      AND connections.target_id = auth.uid()
      AND (connections.category_flags->>events.category)::boolean = true
  )
);
```

**INSERT ポリシー**: 認証済みユーザーのみ投稿可

```sql
CREATE POLICY "events_insert_policy" ON events
FOR INSERT WITH CHECK (
  auth.uid() = host_id
);
```

**UPDATE ポリシー**: 自分の投稿のみ編集可（参加者承認前のみ）

```sql
CREATE POLICY "events_update_policy" ON events
FOR UPDATE USING (
  auth.uid() = host_id
  AND status = 'recruiting'
);
```

**DELETE ポリシー**: 自分の投稿のみ削除可（実際はstatusをcancelledに変更）

```sql
CREATE POLICY "events_delete_policy" ON events
FOR DELETE USING (
  auth.uid() = host_id
);
```

### 4.2 connections テーブル

**SELECT ポリシー**: 自分のつながりリストのみ閲覧可

```sql
CREATE POLICY "connections_select_policy" ON connections
FOR SELECT USING (
  user_id = auth.uid()
  OR target_id = auth.uid()
);
```

**INSERT/UPDATE/DELETE ポリシー**: 自分のつながりリストのみ操作可

```sql
CREATE POLICY "connections_modify_policy" ON connections
FOR ALL USING (
  user_id = auth.uid()
);
```

### 4.3 users テーブル

**SELECT ポリシー**: 全ユーザー閲覧可（公開プロフィール）

```sql
CREATE POLICY "users_select_policy" ON users
FOR SELECT USING (true);
```

**UPDATE ポリシー**: 自分のプロフィールのみ編集可

```sql
CREATE POLICY "users_update_policy" ON users
FOR UPDATE USING (
  auth.uid() = id
);
```

### 4.4 categories テーブル

**SELECT ポリシー**: 全ユーザー閲覧可（マスタデータ）

```sql
CREATE POLICY "categories_select_policy" ON categories
FOR SELECT USING (true);
```

---

## 5. トリガーとファンクション

### 5.1 updated_at自動更新

すべてのテーブルで`updated_at`を自動更新するトリガーを設定します。

```sql
-- トリガーファンクション定義
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを適用
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 投稿上限チェック（1日3件まで）

同一カテゴリの投稿を1日3件までに制限します（spec.md FR-009）。

```sql
-- 投稿上限チェックファンクション
CREATE OR REPLACE FUNCTION check_daily_post_limit()
RETURNS TRIGGER AS $$
DECLARE
  post_count INTEGER;
BEGIN
  -- 今日の該当カテゴリの投稿数をカウント
  SELECT COUNT(*) INTO post_count
  FROM events
  WHERE host_id = NEW.host_id
    AND category = NEW.category
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

  -- 3件以上の場合はエラー
  IF post_count >= 3 THEN
    RAISE EXCEPTION '1日の投稿上限（3件）に達しました';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー適用
CREATE TRIGGER check_events_daily_limit
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_post_limit();
```

---

## 6. マイグレーション順序

データベーススキーマのマイグレーションは以下の順序で実行します:

```bash
# 1. カテゴリマスタ作成（依存なし）
supabase migration create create_categories_table

# 2. ユーザープロフィール作成（auth.usersに依存）
supabase migration create create_users_table

# 3. イベントテーブル作成（users, categoriesに依存）
supabase migration create create_events_table

# 4. つながりリスト作成（usersに依存）
supabase migration create create_connections_table

# 5. RLSポリシー設定
supabase migration create enable_rls_policies

# 6. トリガーとファンクション設定
supabase migration create create_triggers_and_functions
```

---

## 7. パフォーマンス最適化

### 7.1 インデックス戦略

**タイムラインクエリ最適化**:
- `idx_events_timeline`: 募集中イベントの作成日時降順クエリを高速化
- `idx_connections_category_flags`: JSONB検索を高速化（GINインデックス）

**頻出クエリ最適化**:
- `idx_events_host_id`: 自分の投稿一覧取得を高速化
- `idx_connections_user_id`: つながりリスト取得を高速化

### 7.2 クエリ最適化例

**タイムライン取得（つながりリストベース）**:
```sql
-- RLSポリシーが自動的に適用される
SELECT * FROM events
WHERE status = 'recruiting'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

**自分の投稿一覧**:
```sql
SELECT * FROM events
WHERE host_id = auth.uid()
ORDER BY created_at DESC;
```

---

## 8. テストデータ

開発・テスト用のサンプルデータを生成します。

```sql
-- テストユーザー作成（Supabase Auth経由で作成後、プロフィール追加）
INSERT INTO users (id, display_name, enabled_categories) VALUES
  ('uuid-user-1', 'テストユーザー1', ARRAY['drinking', 'travel']),
  ('uuid-user-2', 'テストユーザー2', ARRAY['tennis', 'other']);

-- つながり作成
INSERT INTO connections (user_id, target_id, category_flags) VALUES
  ('uuid-user-1', 'uuid-user-2', '{"drinking": true, "travel": true, "tennis": false, "other": false}'::jsonb);

-- イベント作成
INSERT INTO events (
  category, title, anon_id, date_start, date_end,
  capacity_min, capacity_max, price_min, price_max,
  comment, host_id
) VALUES (
  'drinking',
  '軽く飲みませんか?',
  '🍶A',
  '2025-11-15 19:00:00+09',
  '2025-11-15 22:00:00+09',
  3, 5, 3000, 5000,
  '仕事終わりに軽く一杯どうですか?',
  'uuid-user-1'
);
```

---

## 9. 今後の拡張

フェーズ2以降で追加が見込まれるテーブル:

- **participants**: イベント参加者管理（参加申請、承認ステータス）
- **messages**: イベント内チャット
- **stores**: 店舗情報（Google Places API連携）
- **settlements**: 精算情報（Stripe決済連携）
- **tasks**: 幹事タスク管理

これらはフェーズ1では実装せず、必要になったタイミングでマイグレーションを追加します。
