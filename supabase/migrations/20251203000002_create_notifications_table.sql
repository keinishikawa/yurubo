/**
 * ファイル名: 20251203000002_create_notifications_table.sql
 *
 * 【概要】
 * notificationsテーブルのマイグレーション
 * アプリ内通知を管理するテーブルを作成
 *
 * 【主要機能】
 * - アプリ内通知テーブル作成
 * - 通知タイプ管理（connection_request, connection_accepted）
 * - 既読/未読状態管理
 * - 追加データ格納（JSONB型）
 * - インデックス作成（検索高速化）
 * - RLSポリシー設定（自分の通知のみ操作可）
 *
 * 【依存関係】
 * - users テーブル（user_id参照）
 *
 * 【設計根拠】
 * - data-model.md「3.2 notifications（通知）」に基づく
 * - research.md「1.5 通知機能」の決定に従い設計
 */

-- ==========================================
-- 1. notificationsテーブル作成
-- ==========================================

/**
 * notificationsテーブル
 *
 * 【用途】アプリ内通知を管理
 * 【特徴】
 * - user_id: 通知対象ユーザー
 * - type: 通知タイプ（connection_request, connection_accepted）
 * - title: 通知タイトル
 * - body: 通知本文
 * - data: 追加データ（JSONB型、リンク先等）
 * - is_read: 既読フラグ
 *
 * 【通知タイプ】
 * - connection_request: つながりリクエスト受信
 * - connection_accepted: つながりリクエスト承認
 *
 * 【データ例】
 * user_id: uuid-B, type: "connection_request",
 * title: "つながりリクエスト", body: "ユーザーAさんからリクエストが届きました",
 * data: {"request_id": "uuid", "sender_id": "uuid-A", "sender_name": "ユーザーA", "link": "/connections/requests"}
 */
CREATE TABLE notifications (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 通知対象ユーザー
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 通知コンテンツ
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- 追加データ（JSONB型）
  data JSONB NOT NULL DEFAULT '{}',

  -- 既読フラグ
  is_read BOOLEAN NOT NULL DEFAULT false,

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- テーブルコメント
COMMENT ON TABLE notifications IS 'アプリ内通知を管理するテーブル';
COMMENT ON COLUMN notifications.id IS '通知ID（UUID）';
COMMENT ON COLUMN notifications.user_id IS '通知対象ユーザーのID';
COMMENT ON COLUMN notifications.type IS '通知タイプ（connection_request, connection_accepted）';
COMMENT ON COLUMN notifications.title IS '通知タイトル';
COMMENT ON COLUMN notifications.body IS '通知本文';
COMMENT ON COLUMN notifications.data IS '追加データ（リンク先、送信者情報等）';
COMMENT ON COLUMN notifications.is_read IS '既読フラグ（true: 既読, false: 未読）';
COMMENT ON COLUMN notifications.created_at IS '通知作成日時';

-- ==========================================
-- 2. インデックス作成
-- ==========================================

/**
 * user_idインデックス
 *
 * 【用途】自分の通知一覧取得時に使用
 * 【最適化対象クエリ】
 * SELECT * FROM notifications WHERE user_id = auth.uid()
 */
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

/**
 * user_id + is_read複合インデックス
 *
 * 【用途】未読通知のカウント・一覧取得時に使用
 * 【最適化対象クエリ】
 * SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid() AND is_read = false
 */
CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);

/**
 * created_atインデックス（降順）
 *
 * 【用途】通知一覧の新しい順ソート時に使用
 * 【最適化対象クエリ】
 * SELECT * FROM notifications ORDER BY created_at DESC
 */
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ==========================================
-- 3. Row-Level Security (RLS) 設定
-- ==========================================

/**
 * RLS有効化
 *
 * 【理由】
 * 通知は個人情報であり、自分の通知のみ閲覧・操作可能にする必要がある
 */
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

/**
 * SELECT ポリシー: 自分の通知のみ閲覧可
 *
 * 【用途】通知一覧取得時のアクセス制御
 * 【条件】user_idが自分である場合のみ
 */
CREATE POLICY "notifications_select_policy" ON notifications
FOR SELECT USING (
  user_id = auth.uid()
);

/**
 * INSERT ポリシー: 認証済みユーザーのみ作成可
 *
 * 【用途】通知作成時のアクセス制御
 * 【条件】認証済みユーザーのみ
 *
 * 【注意】
 * 通知は主にServer Actionsから作成されるため、
 * service_role keyを使用する場合はRLSをバイパスする
 * ただし、ユーザーが直接作成する場合のセキュリティ対策として設定
 *
 * 【補足】
 * 通常、通知の作成はServer Actions経由で行われ、
 * 自分以外への通知を作成する必要があるため、
 * service_role keyでRLSをバイパスする設計
 */
CREATE POLICY "notifications_insert_policy" ON notifications
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

/**
 * UPDATE ポリシー: 自分の通知のみ更新可
 *
 * 【用途】既読更新時のアクセス制御
 * 【条件】user_idが自分である場合のみ
 *
 * 【ユースケース】
 * - 通知を既読にする（is_read = true）
 */
CREATE POLICY "notifications_update_policy" ON notifications
FOR UPDATE USING (
  user_id = auth.uid()
);

/**
 * DELETE ポリシー: 自分の通知のみ削除可
 *
 * 【用途】通知削除時のアクセス制御
 * 【条件】user_idが自分である場合のみ
 *
 * 【ユースケース】
 * - 古い通知を削除する場合
 * - 通知を一括削除する場合
 */
CREATE POLICY "notifications_delete_policy" ON notifications
FOR DELETE USING (
  user_id = auth.uid()
);
