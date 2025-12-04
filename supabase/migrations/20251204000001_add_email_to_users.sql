/**
 * ファイル名: 20251204000001_add_email_to_users.sql
 *
 * 【概要】
 * usersテーブルにemailカラムを追加
 * Magic Link認証でユーザーを識別するために必要
 *
 * 【変更内容】
 * - emailカラム追加（UNIQUE制約付き）
 * - emailカラムにインデックス追加
 *
 * @see Issue #51 - Phase 0: 認証機能の修正（Magic Link認証への移行）
 */

-- ==========================================
-- 1. emailカラム追加
-- ==========================================

/**
 * emailカラム
 *
 * 【用途】Magic Link認証でユーザーを一意に識別
 * 【制約】
 * - UNIQUE: 同じメールアドレスの重複登録を防止
 * - NULL許可: 既存ユーザー（匿名認証）との互換性のため
 */
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;

-- ==========================================
-- 2. インデックス作成
-- ==========================================

/**
 * emailインデックス
 *
 * 【用途】メールアドレスによるユーザー検索を高速化
 * 【最適化対象クエリ】SELECT * FROM users WHERE email = 'xxx@example.com'
 */
CREATE INDEX idx_users_email ON users(email);
