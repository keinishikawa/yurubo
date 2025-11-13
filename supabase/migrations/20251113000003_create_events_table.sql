/**
 * ファイル名: 20251113000003_create_events_table.sql
 *
 * 【概要】
 * eventsテーブルのマイグレーション
 * ユーザーが作成するイベント情報を管理するテーブルを作成
 *
 * 【主要機能】
 * - イベントテーブル作成
 * - カテゴリ、日時、人数、価格帯などのイベント詳細情報管理
 * - 匿名ID（anon_id）による投稿者匿名化
 * - ステータス管理（recruiting, confirmed, completed, cancelled）
 * - インデックス作成（タイムラインクエリ最適化）
 * - RLSポリシー設定（つながりリストベースのアクセス制御）
 *
 * 【依存関係】
 * - users テーブル（host_id参照）
 * - categories テーブル（category参照）
 */

-- ==========================================
-- 1. eventsテーブル作成
-- ==========================================

/**
 * eventsテーブル
 *
 * 【用途】イベント情報の管理
 * 【特徴】
 * - anon_id: 投稿者を匿名化するためのID（例: 🍶A）
 * - status: イベントステータス管理（recruiting → confirmed → completed or cancelled）
 * - capacity_min/max: 想定人数の範囲
 * - price_min/max: 価格帯の範囲
 * - deadline: 受付締切日時（任意）
 * - CHECK制約: データ整合性の保証
 *
 * 【設計根拠】
 * data-model.md「2.2 events（イベント）」に基づく
 */
CREATE TABLE events (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本情報
  category TEXT NOT NULL REFERENCES categories(value) ON DELETE RESTRICT,
  title TEXT NOT NULL,              -- イベントタイトル（例: 「軽く飲みませんか?」）
  anon_id TEXT NOT NULL,            -- 匿名ID（例: 🍶A）

  -- 開催情報
  date_start TIMESTAMPTZ NOT NULL,  -- 開催開始日時
  date_end TIMESTAMPTZ NOT NULL,    -- 開催終了日時
  deadline TIMESTAMPTZ,             -- 受付締切日時（任意）

  -- 人数情報
  capacity_min INTEGER NOT NULL CHECK (capacity_min >= 1),
  capacity_max INTEGER NOT NULL CHECK (capacity_max >= capacity_min),

  -- 価格情報
  price_min INTEGER CHECK (price_min >= 0),
  price_max INTEGER CHECK (price_max >= price_min),

  -- コメント
  comment TEXT,                     -- 補足説明（任意）

  -- 投稿者情報
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- ステータス
  -- recruiting: 募集中
  -- confirmed: 参加者承認済み
  -- completed: 開催済み
  -- cancelled: 中止
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (status IN (
    'recruiting',
    'confirmed',
    'completed',
    'cancelled'
  )),

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. インデックス作成
-- ==========================================

/**
 * host_idインデックス
 *
 * 【用途】自分の投稿一覧取得時に使用
 * 【最適化対象クエリ】SELECT * FROM events WHERE host_id = auth.uid()
 */
CREATE INDEX idx_events_host_id ON events(host_id);

/**
 * categoryインデックス
 *
 * 【用途】カテゴリ別イベント一覧取得時に使用
 * 【最適化対象クエリ】SELECT * FROM events WHERE category = 'drinking'
 */
CREATE INDEX idx_events_category ON events(category);

/**
 * statusインデックス
 *
 * 【用途】ステータス別イベント一覧取得時に使用
 * 【最適化対象クエリ】SELECT * FROM events WHERE status = 'recruiting'
 */
CREATE INDEX idx_events_status ON events(status);

/**
 * created_atインデックス（降順）
 *
 * 【用途】新着順イベント一覧取得時に使用
 * 【最適化対象クエリ】SELECT * FROM events ORDER BY created_at DESC
 */
CREATE INDEX idx_events_created_at ON events(created_at DESC);

/**
 * date_startインデックス
 *
 * 【用途】開催日時順イベント一覧取得時に使用
 * 【最適化対象クエリ】SELECT * FROM events ORDER BY date_start
 */
CREATE INDEX idx_events_date_start ON events(date_start);

/**
 * 複合インデックス（タイムラインクエリ最適化）
 *
 * 【用途】募集中イベントを新着順に取得するタイムライン表示で使用
 * 【最適化対象クエリ】
 * SELECT * FROM events
 * WHERE status = 'recruiting'
 * ORDER BY created_at DESC
 * LIMIT 20 OFFSET 0
 *
 * 【パフォーマンス効果】
 * - WHERE status = 'recruiting'の絞り込みとORDER BY created_at DESCのソートを
 *   1つのインデックスで効率的に処理
 * - 部分インデックス（WHERE句）により、recruitingステータスのレコードのみを対象
 */
CREATE INDEX idx_events_timeline ON events(status, created_at DESC)
  WHERE status = 'recruiting';

-- ==========================================
-- 3. Row-Level Security (RLS) 有効化
-- ==========================================

/**
 * RLS有効化
 *
 * 【理由】
 * イベント情報は「つながりリスト」ベースで配信制御を行うため、
 * RLSで厳密なアクセス制御が必須
 *
 * 【注意】
 * 具体的なRLSポリシーは、connectionsテーブル作成後に
 * 20251113000006_enable_rls_policies.sql で設定
 */
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
