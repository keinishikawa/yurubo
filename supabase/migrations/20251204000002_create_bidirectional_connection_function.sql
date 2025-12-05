/**
 * ファイル名: 20251204000002_create_bidirectional_connection_function.sql
 *
 * 【概要】
 * 双方向つながり作成用のSECURITY DEFINER関数を作成
 * RLSポリシーをバイパスして、つながり承認時に両方向のレコードを作成する
 *
 * 【背景】
 * connections_insert_policy は user_id = auth.uid() のみを許可するため、
 * 通常のINSERTでは自分のレコード（user_id = auth.uid()）しか作成できない。
 * つながり承認時には、承認者と送信者の双方向レコードが必要なため、
 * SECURITY DEFINER関数でRLSをバイパスする。
 *
 * 【セキュリティ考慮】
 * - この関数は認証済みユーザーのみ呼び出し可能
 * - 呼び出し元のユーザーID（auth.uid()）が必ず片方のuser_idまたはtarget_idになる
 * - 重複チェックを行い、既存つながりがある場合はエラーを返す
 *
 * 【依存関係】
 * - connections テーブル（作成済み）
 * - RLSポリシー（作成済み）
 */

-- 双方向つながり作成関数
CREATE OR REPLACE FUNCTION create_bidirectional_connection(
  partner_id UUID,
  category_flags JSONB DEFAULT '{"drinking": false, "travel": false, "tennis": false, "other": false}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  result JSONB;
BEGIN
  -- 認証チェック
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED',
      'message', '認証が必要です'
    );
  END IF;

  -- 自分自身へのつながり禁止
  IF partner_id = current_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SELF_CONNECTION_NOT_ALLOWED',
      'message', '自分自身とつながりを作成することはできません'
    );
  END IF;

  -- 既存つながりチェック
  IF EXISTS (
    SELECT 1 FROM connections
    WHERE user_id = current_user_id AND target_id = partner_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_CONNECTED',
      'message', 'すでにつながりがあります'
    );
  END IF;

  -- 双方向つながりを作成
  INSERT INTO connections (user_id, target_id, category_flags)
  VALUES
    (current_user_id, partner_id, category_flags),
    (partner_id, current_user_id, category_flags);

  RETURN jsonb_build_object(
    'success', true,
    'code', 'CONNECTION_CREATED',
    'message', 'つながりを作成しました'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_CONNECTED',
      'message', 'すでにつながりがあります'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DATABASE_ERROR',
      'message', 'データベースエラーが発生しました: ' || SQLERRM
    );
END;
$$;

-- 関数の実行権限を認証済みユーザーに付与
GRANT EXECUTE ON FUNCTION create_bidirectional_connection(UUID, JSONB) TO authenticated;

-- コメント追加
COMMENT ON FUNCTION create_bidirectional_connection IS '双方向つながりを作成する関数。つながり承認時に使用。RLSをバイパスして両方向のレコードを作成する。';
