/**
 * ファイル名: 20251113000004_create_connections_table.sql
 *
 * 【概要】
 * connectionsテーブルのマイグレーション
 * ユーザー間のつながりとカテゴリ単位の配信許可を管理するテーブルを作成
 *
 * 【主要機能】
 * - つながりリストテーブル作成
 * - カテゴリ単位のOK/NGフラグ管理（JSONB型）
 * - 双方向つながり管理（AがBを追加 ≠ BがAを追加）
 * - インデックス作成（GINインデックスでJSONB検索高速化）
 * - RLSポリシー設定（自分のつながりのみ操作可）
 *
 * 【依存関係】
 * - users テーブル（user_id, target_id参照）
 * - categories テーブル（category_flagsのキー参照）
 */

-- ==========================================
-- 1. connectionsテーブル作成
-- ==========================================

/**
 * connectionsテーブル
 *
 * 【用途】ユーザー間のつながりとカテゴリ単位の配信許可を管理
 * 【特徴】
 * - 複合主キー（user_id, target_id）
 * - category_flags: JSONB型でカテゴリごとのOK/NGフラグを管理
 * - CHECK制約: 自分自身へのつながりを禁止
 * - 双方向管理: AがBをつながりに追加しても、BがAをつながりに追加したことにはならない
 *
 * 【データ例】
 * user_id: uuid-A, target_id: uuid-B, category_flags: {"drinking": true, "travel": false}
 * → ユーザーAがユーザーBをつながりに追加
 * → ユーザーBの「飲み」カテゴリ投稿は受信OK、「旅行」カテゴリ投稿は受信NG
 *
 * 【設計根拠】
 * data-model.md「2.3 connections（つながりリスト）」に基づく
 */
CREATE TABLE connections (
  -- 複合主キー
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- カテゴリ単位のフラグ（JSONB型）
  -- デフォルトは全カテゴリNG（false）
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

  -- 自分自身へのつながりを禁止
  CHECK (user_id != target_id)
);

-- ==========================================
-- 2. インデックス作成
-- ==========================================

/**
 * user_idインデックス
 *
 * 【用途】自分のつながりリスト取得時に使用
 * 【最適化対象クエリ】SELECT * FROM connections WHERE user_id = auth.uid()
 */
CREATE INDEX idx_connections_user_id ON connections(user_id);

/**
 * target_idインデックス
 *
 * 【用途】自分をつながりに追加しているユーザー一覧取得時に使用
 * 【最適化対象クエリ】SELECT * FROM connections WHERE target_id = auth.uid()
 */
CREATE INDEX idx_connections_target_id ON connections(target_id);

/**
 * category_flagsインデックス（GINインデックス）
 *
 * 【用途】JSONB型カラムの検索高速化
 * 【最適化対象クエリ】
 * SELECT * FROM connections
 * WHERE (category_flags->>'drinking')::boolean = true
 *
 * 【GINインデックスの特徴】
 * - JSONB型の全キーを対象としたインデックス作成
 * - キー単位の検索を高速化
 * - events_select_policyでのJOIN時に効率的に使用される
 *
 * 【パフォーマンス効果】
 * - タイムラインクエリで「つながりリスト内の該当カテゴリOKユーザー」の
 *   絞り込みを高速化
 */
CREATE INDEX idx_connections_category_flags ON connections USING GIN (category_flags);

-- ==========================================
-- 3. Row-Level Security (RLS) 有効化
-- ==========================================

/**
 * RLS有効化
 *
 * 【理由】
 * つながりリストは個人情報であり、自分のつながり情報のみ閲覧・編集可能にする必要がある
 *
 * 【注意】
 * 具体的なRLSポリシーは
 * 20251113000006_enable_rls_policies.sql で設定
 */
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
