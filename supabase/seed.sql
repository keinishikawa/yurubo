/**
 * ファイル名: seed.sql
 *
 * 【概要】
 * 開発・テスト用のサンプルデータ投入スクリプト
 *
 * 【注意】
 * このファイルは現在空です。
 *
 * 【理由】
 * - usersテーブルはauth.users（Supabase Auth）への外部キー参照を持つため、
 *   seed.sqlで直接INSERTできません
 * - auth.usersへのユーザー追加はSupabase Auth APIまたはSupabase Studioから行う必要があります
 *
 * 【テストデータ作成手順】
 * 1. Supabase Studio (http://localhost:54323) にアクセス
 * 2. Authentication → Users でテストユーザーを手動作成
 * 3. Database → SQL Editor で以下のようなSQLを実行:
 *    ```sql
 *    INSERT INTO users (id, display_name, enabled_categories)
 *    VALUES (
 *      '<auth.usersで作成したユーザーのUUID>',
 *      'テストユーザー1',
 *      ARRAY['drinking', 'travel']
 *    );
 *    ```
 *
 * 【代替手段】
 * - E2Eテスト: テストユーザーを動的に作成
 * - 単体/統合テスト: モックデータを使用
 */

-- このファイルは意図的に空のままにしています
-- テストデータが必要な場合は上記の手順に従ってください
