/**
 * ファイル名: 20251113000006_enable_rls_policies.sql
 *
 * 【概要】
 * すべてのテーブルのRow-Level Security (RLS) ポリシーを設定
 *
 * 【主要機能】
 * - events テーブルのRLSポリシー設定
 * - connections テーブルのRLSポリシー設定
 * - つながりリストベースのアクセス制御実装
 *
 * 【依存関係】
 * - categories, users, events, connections テーブル（すべて作成済み）
 *
 * 【注意】
 * このマイグレーションはすべてのテーブル作成後に実行される必要がある
 * 特にeventsテーブルのSELECTポリシーはconnectionsテーブルを参照するため、
 * connectionsテーブル作成後に実行する必要がある
 */

-- ==========================================
-- 1. eventsテーブルのRLSポリシー
-- ==========================================

/**
 * SELECT ポリシー: つながりリスト内のカテゴリOKユーザーのみ閲覧可
 *
 * 【用途】タイムライン表示時のアクセス制御
 * 【条件】
 * 1. 自分の投稿は常に閲覧可（host_id = auth.uid()）
 * 2. つながりリスト内で該当カテゴリOKの投稿のみ閲覧可
 *
 * 【処理フロー】
 * 1. 投稿者（host_id）が自分の場合 → OK
 * 2. connectionsテーブルを検索:
 *    - user_id（投稿者）がtarget_id（閲覧者）をつながりに追加している
 *    - かつ、category_flags[イベントのカテゴリ]がtrue
 *
 * 【設計根拠】
 * spec.md FR-008「つながりリストベースの配信制御」に基づく
 */
CREATE POLICY "events_select_policy" ON events
FOR SELECT USING (
  -- 自分の投稿は常に閲覧可
  host_id = auth.uid()
  OR
  -- つながりリスト内で該当カテゴリOKの投稿のみ閲覧可
  EXISTS (
    SELECT 1 FROM connections
    WHERE connections.user_id = events.host_id
      AND connections.target_id = auth.uid()
      AND (connections.category_flags->>events.category)::boolean = true
  )
);

/**
 * INSERT ポリシー: 認証済みユーザーのみ投稿可
 *
 * 【用途】イベント作成時のアクセス制御
 * 【条件】auth.uid()（認証済みユーザーのID）とhost_idが一致する場合のみ
 *
 * 【理由】
 * 他人のIDを使って投稿することを防ぐ
 */
CREATE POLICY "events_insert_policy" ON events
FOR INSERT WITH CHECK (
  auth.uid() = host_id
);

/**
 * UPDATE ポリシー: 自分の投稿のみ編集可（参加者承認前のみ）
 *
 * 【用途】イベント編集時のアクセス制御
 * 【条件】
 * 1. auth.uid()とhost_idが一致
 * 2. statusがrecruiting（募集中）である
 *
 * 【設計根拠】
 * spec.md FR-013「参加者承認前のみ編集可能」に基づく
 */
CREATE POLICY "events_update_policy" ON events
FOR UPDATE USING (
  auth.uid() = host_id
  AND status = 'recruiting'
);

/**
 * DELETE ポリシー: 自分の投稿のみ削除可
 *
 * 【用途】イベント削除時のアクセス制御
 * 【条件】auth.uid()とhost_idが一致する場合のみ
 *
 * 【注意】
 * 実際のアプリでは物理削除ではなく、statusをcancelledに変更する論理削除を推奨
 * このポリシーは万が一の物理削除時の安全策
 */
CREATE POLICY "events_delete_policy" ON events
FOR DELETE USING (
  auth.uid() = host_id
);

-- ==========================================
-- 2. connectionsテーブルのRLSポリシー
-- ==========================================

/**
 * SELECT ポリシー: 自分のつながりリストのみ閲覧可
 *
 * 【用途】つながりリスト取得時のアクセス制御
 * 【条件】
 * 1. user_idが自分（自分が追加したつながり）
 * 2. target_idが自分（自分を追加したユーザー）
 *
 * 【理由】
 * - user_id = auth.uid(): 自分のつながりリストを取得する際に必要
 * - target_id = auth.uid(): 誰が自分をつながりに追加しているか確認する際に必要
 */
CREATE POLICY "connections_select_policy" ON connections
FOR SELECT USING (
  user_id = auth.uid()
  OR target_id = auth.uid()
);

/**
 * INSERT ポリシー: 自分のつながりリストのみ追加可
 *
 * 【用途】つながり追加時のアクセス制御
 * 【条件】user_idが自分である場合のみ
 *
 * 【理由】
 * 他人のつながりリストに勝手に追加することを防ぐ
 */
CREATE POLICY "connections_insert_policy" ON connections
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

/**
 * UPDATE ポリシー: 自分のつながりリストのみ編集可
 *
 * 【用途】カテゴリフラグ変更時のアクセス制御
 * 【条件】user_idが自分である場合のみ
 *
 * 【ユースケース】
 * ユーザーがつながりリスト画面で「飲みカテゴリをONにする」などの操作を行う際に使用
 */
CREATE POLICY "connections_update_policy" ON connections
FOR UPDATE USING (
  user_id = auth.uid()
);

/**
 * DELETE ポリシー: 自分のつながりリストのみ削除可
 *
 * 【用途】つながり削除時のアクセス制御
 * 【条件】user_idが自分である場合のみ
 *
 * 【ユースケース】
 * ユーザーがつながりリストから特定のユーザーを削除する際に使用
 */
CREATE POLICY "connections_delete_policy" ON connections
FOR DELETE USING (
  user_id = auth.uid()
);
