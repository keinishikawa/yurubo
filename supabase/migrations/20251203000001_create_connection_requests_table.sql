/**
 * ファイル名: 20251203000001_create_connection_requests_table.sql
 *
 * 【概要】
 * connection_requestsテーブルのマイグレーション
 * つながりリクエスト（承認待ち状態）を管理するテーブルを作成
 *
 * 【主要機能】
 * - つながりリクエストテーブル作成
 * - 有効期限管理（7日後に自動期限切れ）
 * - 同一相手への重複リクエスト防止
 * - 自分自身へのリクエスト禁止
 * - インデックス作成（検索高速化）
 * - RLSポリシー設定（自分のリクエストのみ操作可）
 *
 * 【依存関係】
 * - users テーブル（sender_id, receiver_id参照）
 *
 * 【設計根拠】
 * - data-model.md「3.1 connection_requests（つながりリクエスト）」に基づく
 * - research.md「1.2 つながりリクエスト管理」の決定に従い、
 *   connectionsテーブルとは別のテーブルとして作成
 */

-- ==========================================
-- 1. connection_requestsテーブル作成
-- ==========================================

/**
 * connection_requestsテーブル
 *
 * 【用途】つながり成立前の申請状態を管理
 * 【特徴】
 * - sender_id: リクエスト送信者
 * - receiver_id: リクエスト受信者
 * - message: 任意のメッセージ（オプション）
 * - expires_at: 有効期限（デフォルト7日後）
 * - CHECK制約: 自分自身へのリクエストを禁止
 * - UNIQUE制約: 同一相手への重複リクエストを禁止
 *
 * 【ライフサイクル】
 * 1. リクエスト送信 → レコード作成
 * 2a. 承認 → connectionsテーブルに双方向レコード作成、このレコード削除
 * 2b. 拒否 → このレコード削除
 * 2c. 期限切れ → 表示時にフィルタ（アクセス時チェック方式）
 *
 * 【データ例】
 * sender_id: uuid-A, receiver_id: uuid-B, message: "友達になりましょう！"
 * → ユーザーAがユーザーBにつながりリクエストを送信
 */
CREATE TABLE connection_requests (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- リクエスト関係
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 任意メッセージ
  message TEXT DEFAULT NULL,

  -- 有効期限（デフォルト7日後）
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 自分自身へのリクエスト禁止
  CONSTRAINT connection_requests_no_self_request CHECK (sender_id != receiver_id),

  -- 同一相手への重複リクエスト禁止
  CONSTRAINT connection_requests_unique_pair UNIQUE (sender_id, receiver_id)
);

-- テーブルコメント
COMMENT ON TABLE connection_requests IS 'つながりリクエスト（承認待ち状態）を管理するテーブル';
COMMENT ON COLUMN connection_requests.id IS 'リクエストID（UUID）';
COMMENT ON COLUMN connection_requests.sender_id IS 'リクエスト送信者のユーザーID';
COMMENT ON COLUMN connection_requests.receiver_id IS 'リクエスト受信者のユーザーID';
COMMENT ON COLUMN connection_requests.message IS '任意のメッセージ（オプション）';
COMMENT ON COLUMN connection_requests.expires_at IS '有効期限（デフォルト7日後）';
COMMENT ON COLUMN connection_requests.created_at IS 'リクエスト作成日時';

-- ==========================================
-- 2. インデックス作成
-- ==========================================

/**
 * sender_idインデックス
 *
 * 【用途】送信したリクエスト一覧取得時に使用
 * 【最適化対象クエリ】
 * SELECT * FROM connection_requests WHERE sender_id = auth.uid()
 */
CREATE INDEX idx_connection_requests_sender_id ON connection_requests(sender_id);

/**
 * receiver_idインデックス
 *
 * 【用途】受信したリクエスト一覧取得時に使用
 * 【最適化対象クエリ】
 * SELECT * FROM connection_requests WHERE receiver_id = auth.uid()
 */
CREATE INDEX idx_connection_requests_receiver_id ON connection_requests(receiver_id);

/**
 * expires_atインデックス
 *
 * 【用途】期限切れリクエストのフィルタリング時に使用
 * 【最適化対象クエリ】
 * SELECT * FROM connection_requests WHERE expires_at > NOW()
 */
CREATE INDEX idx_connection_requests_expires_at ON connection_requests(expires_at);

-- ==========================================
-- 3. Row-Level Security (RLS) 設定
-- ==========================================

/**
 * RLS有効化
 *
 * 【理由】
 * つながりリクエストは個人情報であり、
 * 自分が送信者または受信者のリクエストのみ操作可能にする必要がある
 */
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

/**
 * SELECT ポリシー: 自分が送信者または受信者のリクエストのみ閲覧可
 *
 * 【用途】リクエスト一覧取得時のアクセス制御
 * 【条件】
 * 1. sender_idが自分（自分が送信したリクエスト）
 * 2. receiver_idが自分（自分が受信したリクエスト）
 */
CREATE POLICY "connection_requests_select_policy" ON connection_requests
FOR SELECT USING (
  sender_id = auth.uid()
  OR receiver_id = auth.uid()
);

/**
 * INSERT ポリシー: 自分が送信者のリクエストのみ作成可
 *
 * 【用途】リクエスト送信時のアクセス制御
 * 【条件】sender_idが自分である場合のみ
 *
 * 【理由】
 * 他人のIDを使ってリクエストを送信することを防ぐ
 */
CREATE POLICY "connection_requests_insert_policy" ON connection_requests
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);

/**
 * DELETE ポリシー: 自分が送信者または受信者のリクエストのみ削除可
 *
 * 【用途】リクエスト承認・拒否・キャンセル時のアクセス制御
 * 【条件】
 * 1. sender_idが自分（送信キャンセル）
 * 2. receiver_idが自分（承認・拒否後の削除）
 *
 * 【ユースケース】
 * - 送信者: リクエストをキャンセルしたい場合
 * - 受信者: 承認または拒否後にリクエストを削除する場合
 */
CREATE POLICY "connection_requests_delete_policy" ON connection_requests
FOR DELETE USING (
  sender_id = auth.uid()
  OR receiver_id = auth.uid()
);
