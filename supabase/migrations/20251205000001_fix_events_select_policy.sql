/**
 * ファイル名: 20251205000001_fix_events_select_policy.sql
 *
 * 【概要】
 * eventsテーブルのSELECTポリシーを修正
 * 閲覧者の設定に基づいてフィルタリングするように変更
 *
 * 【修正内容】
 * 修正前: 投稿者が閲覧者をつながりに追加している場合に表示
 * 修正後: 閲覧者が投稿者をつながりに追加している場合に表示
 *
 * 【根拠】
 * US3「アクティビティ単位の関係設定」では、閲覧者が自分のつながりリストで
 * カテゴリ設定を行い、そのカテゴリOKの投稿のみを受信する設計
 */

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "events_select_policy" ON events;

-- 修正版ポリシーを作成
CREATE POLICY "events_select_policy" ON events
FOR SELECT USING (
  -- 自分の投稿は常に閲覧可
  host_id = auth.uid()
  OR
  -- 閲覧者のつながりリストで該当カテゴリOKの投稿のみ閲覧可
  EXISTS (
    SELECT 1 FROM connections
    WHERE connections.user_id = auth.uid()           -- 閲覧者のつながりリスト
      AND connections.target_id = events.host_id     -- 投稿者がつながり先
      AND (connections.category_flags->>events.category)::boolean = true
  )
);
