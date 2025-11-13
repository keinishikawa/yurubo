/**
 * ファイル名: 20251113000001_create_categories_table.sql
 *
 * 【概要】
 * categoriesテーブルのマイグレーション
 * イベントカテゴリのマスタデータを管理するテーブルを作成
 *
 * 【主要機能】
 * - カテゴリマスタテーブル作成
 * - 初期カテゴリデータ投入（飲み、旅行、テニス、その他）
 * - インデックス作成
 * - RLSポリシー設定（全ユーザー閲覧可）
 *
 * 【依存関係】
 * なし（最初に実行されるマイグレーション）
 */

-- ==========================================
-- 1. categoriesテーブル作成
-- ==========================================

/**
 * categoriesテーブル
 *
 * 【用途】イベントカテゴリのマスタデータ管理
 * 【特徴】
 * - valueを主キーとし、内部識別子として使用
 * - label（日本語表示名）とemoji（カテゴリ絵文字）で表示用データを保持
 * - display_orderで表示順序を制御
 */
CREATE TABLE categories (
  -- 主キー（内部識別子）
  value TEXT PRIMARY KEY,

  -- 表示情報
  label TEXT NOT NULL,      -- 日本語表示名（例: 飲み）
  emoji TEXT NOT NULL,      -- カテゴリ絵文字（例: 🍶）

  -- 表示順序
  display_order INTEGER NOT NULL DEFAULT 0,

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. インデックス作成
-- ==========================================

/**
 * display_orderインデックス
 *
 * 【用途】カテゴリ一覧を表示順序でソートして取得する際に使用
 * 【最適化対象クエリ】SELECT * FROM categories ORDER BY display_order
 */
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- ==========================================
-- 3. 初期データ投入
-- ==========================================

/**
 * 初期カテゴリデータ
 *
 * 【カテゴリ一覧】
 * 1. 飲み（🍶）- drinking
 * 2. 旅行（✈️）- travel
 * 3. テニス（🎾）- tennis
 * 4. その他（📌）- other
 *
 * 【設計根拠】
 * spec.md FR-003に基づく初期カテゴリ定義
 */
INSERT INTO categories (value, label, emoji, display_order) VALUES
  ('drinking', '飲み', '🍶', 1),
  ('travel', '旅行', '✈️', 2),
  ('tennis', 'テニス', '🎾', 3),
  ('other', 'その他', '📌', 4);

-- ==========================================
-- 4. Row-Level Security (RLS) 設定
-- ==========================================

/**
 * RLS有効化
 *
 * 【理由】
 * Supabaseではテーブル作成時にRLSを有効化し、
 * 明示的にポリシーを設定する必要がある
 */
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

/**
 * SELECT ポリシー: 全ユーザー閲覧可
 *
 * 【用途】カテゴリマスタは全ユーザーが参照可能
 * 【条件】常にtrue（制限なし）
 */
CREATE POLICY "categories_select_policy" ON categories
FOR SELECT USING (true);

/**
 * INSERT/UPDATE/DELETE ポリシー: 禁止
 *
 * 【理由】
 * カテゴリマスタは管理者のみがマイグレーションで変更可能
 * 一般ユーザーからの変更は許可しない
 *
 * 【注意】
 * ポリシーを作成しない場合、RLS有効時は暗黙的に拒否される
 */
-- INSERT/UPDATE/DELETEポリシーは意図的に作成しない（管理者のみ操作可能）
