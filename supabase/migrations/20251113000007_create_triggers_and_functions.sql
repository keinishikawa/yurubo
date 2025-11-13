/**
 * ファイル名: 20251113000005_create_triggers_and_functions.sql
 *
 * 【概要】
 * トリガーとファンクションのマイグレーション
 * 自動化処理と整合性チェックを実装
 *
 * 【主要機能】
 * 1. updated_at自動更新トリガー（users, events, connections）
 * 2. 投稿上限チェックトリガー（1日3件まで、カテゴリ別）
 *
 * 【依存関係】
 * - users, events, connections テーブル
 */

-- ==========================================
-- 1. updated_at自動更新ファンクション
-- ==========================================

/**
 * update_updated_at_column() ファンクション
 *
 * 【用途】レコード更新時にupdated_atカラムを自動的に現在時刻に更新
 * 【適用対象】users, events, connectionsテーブル
 *
 * 【処理内容】
 * 1. UPDATE操作が実行される直前（BEFORE UPDATE）に呼び出される
 * 2. NEW.updated_atに現在時刻（NOW()）を設定
 * 3. 更新後のレコード（NEW）を返す
 *
 * 【文法】
 * - RETURNS TRIGGER: トリガーファンクション専用の戻り値型
 * - NEW: UPDATE後の新しいレコード（UPDATE/INSERT時に使用可能）
 * - OLD: UPDATE前の古いレコード（UPDATE/DELETE時に使用可能）
 * - LANGUAGE plpgsql: PostgreSQL標準の手続き型SQL言語
 */
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- 【処理】現在時刻をupdated_atに設定
  NEW.updated_at = NOW();

  -- 【処理】更新後のレコードを返す（BEFORE TRIGGERでは必須）
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. updated_atトリガー適用
-- ==========================================

/**
 * usersテーブル用トリガー
 *
 * 【用途】ユーザープロフィール更新時にupdated_atを自動更新
 * 【タイミング】BEFORE UPDATE（更新処理の直前）
 * 【実行単位】FOR EACH ROW（行ごとに実行）
 */
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

/**
 * eventsテーブル用トリガー
 *
 * 【用途】イベント情報更新時にupdated_atを自動更新
 * 【タイミング】BEFORE UPDATE（更新処理の直前）
 * 【実行単位】FOR EACH ROW（行ごとに実行）
 */
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

/**
 * connectionsテーブル用トリガー
 *
 * 【用途】つながりリスト更新時にupdated_atを自動更新
 * 【タイミング】BEFORE UPDATE（更新処理の直前）
 * 【実行単位】FOR EACH ROW（行ごとに実行）
 */
CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. 投稿上限チェックファンクション
-- ==========================================

/**
 * check_daily_post_limit() ファンクション
 *
 * 【用途】同一カテゴリの投稿を1日3件までに制限
 * 【適用対象】eventsテーブルのINSERT操作
 *
 * 【処理フロー】
 * 1. 今日（CURRENT_DATE）の該当カテゴリ投稿数をカウント
 * 2. 3件以上の場合はRAISE EXCEPTIONでエラー送出
 * 3. 3件未満の場合は新規レコード（NEW）を返す
 *
 * 【設計根拠】
 * spec.md FR-009「1日あたりカテゴリ別投稿上限3件」に基づく
 *
 * 【エラーハンドリング】
 * - RAISE EXCEPTION: PostgreSQL例外を送出
 * - エラーメッセージは日本語で明確に記述
 * - クライアント側で catch して適切なUIメッセージを表示
 *
 * 【文法】
 * - DECLARE: 変数宣言セクション
 * - INTO: SELECTの結果を変数に代入
 * - CURRENT_DATE: 今日の日付（時刻なし）
 * - INTERVAL '1 day': 1日間のインターバル
 */
CREATE OR REPLACE FUNCTION check_daily_post_limit()
RETURNS TRIGGER AS $$
DECLARE
  -- 【変数】今日の投稿数をカウントする変数
  post_count INTEGER;
BEGIN
  -- 【処理1】今日の該当カテゴリの投稿数をカウント
  -- 【条件】
  -- - host_id = NEW.host_id: 同じ投稿者
  -- - category = NEW.category: 同じカテゴリ
  -- - created_at >= CURRENT_DATE: 今日の0時以降
  -- - created_at < CURRENT_DATE + INTERVAL '1 day': 明日の0時より前（今日中）
  SELECT COUNT(*) INTO post_count
  FROM events
  WHERE host_id = NEW.host_id
    AND category = NEW.category
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

  -- 【処理2】投稿数チェック
  -- 3件以上の場合はエラーを送出
  IF post_count >= 3 THEN
    -- 【エラー】1日の投稿上限に達した場合
    -- クライアント側でこのメッセージをキャッチしてUIに表示
    RAISE EXCEPTION '1日の投稿上限（3件）に達しました';
  END IF;

  -- 【処理3】チェックOKの場合、新規レコードを返す
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. 投稿上限チェックトリガー適用
-- ==========================================

/**
 * eventsテーブル用投稿上限チェックトリガー
 *
 * 【用途】イベント投稿時に1日3件上限をチェック
 * 【タイミング】BEFORE INSERT（挿入処理の直前）
 * 【実行単位】FOR EACH ROW（行ごとに実行）
 *
 * 【動作】
 * 1. INSERT操作が実行される直前に呼び出される
 * 2. check_daily_post_limit()ファンクションが実行される
 * 3. 上限超過の場合はRAISE EXCEPTIONでINSERT操作が中断される
 * 4. 上限内の場合はINSERT操作が正常に実行される
 */
CREATE TRIGGER check_events_daily_limit
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_post_limit();
