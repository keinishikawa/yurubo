-- eventsテーブルのUPDATEポリシーを修正
-- 元のポリシーは WITH CHECK が指定されていなかったため、USING句の条件 (status = 'recruiting') が
-- 新しい行（status = 'cancelled'）にも適用され、更新が拒否されていた。

DROP POLICY "events_update_policy" ON events;

CREATE POLICY "events_update_policy" ON events
FOR UPDATE USING (
  auth.uid() = host_id
) WITH CHECK (
  auth.uid() = host_id
);
