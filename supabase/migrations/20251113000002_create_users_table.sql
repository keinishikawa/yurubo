/**
 * ファイル名: 20251113000002_create_users_table.sql
 *
 * 【概要】
 * usersテーブルのマイグレーション
 * Supabase Authのauth.usersを拡張するプロファイルテーブルを作成
 *
 * 【主要機能】
 * - ユーザープロフィールテーブル作成
 * - 有効カテゴリ管理（enabled_categories）
 * - 通知設定管理（notification_preferences）
 * - インデックス作成
 * - RLSポリシー設定（全ユーザー閲覧可、自分のみ編集可）
 *
 * 【依存関係】
 * - auth.users（Supabase Auth）
 * - categories テーブル（enabled_categoriesの参照先）
 */

-- ==========================================
-- 1. usersテーブル作成
-- ==========================================

/**
 * usersテーブル
 *
 * 【用途】ユーザーの基本情報と設定を管理
 * 【特徴】
 * - auth.users.idと1対1で紐づく拡張プロファイル
 * - enabled_categories: ユーザーが有効にしているカテゴリのリスト（配列型）
 * - notification_preferences: 通知設定（JSONB型）
 * - ON DELETE CASCADE: auth.usersが削除されたら自動削除
 *
 * 【設計根拠】
 * data-model.md「2.1 users（ユーザー）」に基づく
 */
CREATE TABLE users (
  -- 主キー（Supabase Auth UUIDと一致）
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基本情報
  display_name TEXT NOT NULL,     -- 表示名（実名または仮名）
  avatar_url TEXT,                -- プロフィール画像URL
  bio TEXT,                       -- 自己紹介

  -- 有効カテゴリ（つながりリスト初期状態で使用）
  -- デフォルトは全カテゴリ有効
  enabled_categories TEXT[] NOT NULL DEFAULT ARRAY['drinking', 'travel', 'tennis', 'other'],

  -- 通知設定（JSONB型）
  -- デフォルトは全通知ON
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

-- ==========================================
-- 2. インデックス作成
-- ==========================================

/**
 * display_nameインデックス
 *
 * 【用途】ユーザー検索時に使用
 * 【最適化対象クエリ】SELECT * FROM users WHERE display_name LIKE '%keyword%'
 */
CREATE INDEX idx_users_display_name ON users(display_name);

-- ==========================================
-- 3. Row-Level Security (RLS) 設定
-- ==========================================

/**
 * RLS有効化
 *
 * 【理由】
 * ユーザープロフィールは公開情報（display_name, avatar_url等）と
 * プライベート情報（notification_preferences）が混在するため、
 * RLSで適切なアクセス制御を行う
 */
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

/**
 * SELECT ポリシー: 全ユーザー閲覧可
 *
 * 【用途】公開プロフィール情報（display_name, avatar_url, bio）は全ユーザーが閲覧可能
 * 【条件】常にtrue（制限なし）
 *
 * 【注意】
 * notification_preferencesなどのプライベート情報も含まれるが、
 * クライアント側でSELECT時に必要なカラムのみ取得することで対応
 * 例: SELECT id, display_name, avatar_url FROM users
 */
CREATE POLICY "users_select_policy" ON users
FOR SELECT USING (true);

/**
 * INSERT ポリシー: 自分のプロフィールのみ作成可
 *
 * 【用途】Supabase Authでユーザー登録後、プロフィール作成時に使用
 * 【条件】auth.uid()（認証済みユーザーのID）と一致する場合のみ
 */
CREATE POLICY "users_insert_policy" ON users
FOR INSERT WITH CHECK (
  auth.uid() = id
);

/**
 * UPDATE ポリシー: 自分のプロフィールのみ編集可
 *
 * 【用途】プロフィール編集、通知設定変更時に使用
 * 【条件】auth.uid()と一致する場合のみ
 */
CREATE POLICY "users_update_policy" ON users
FOR UPDATE USING (
  auth.uid() = id
);

/**
 * DELETE ポリシー: 自分のプロフィールのみ削除可
 *
 * 【用途】ユーザーが自分のアカウントを削除する場合
 * 【条件】auth.uid()と一致する場合のみ
 *
 * 【注意】
 * 実際の削除はauth.usersの削除に連動して自動実行される（ON DELETE CASCADE）
 * このポリシーは明示的削除時のみ適用
 */
CREATE POLICY "users_delete_policy" ON users
FOR DELETE USING (
  auth.uid() = id
);
