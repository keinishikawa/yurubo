# Quickstart Guide: フェーズ1：イベント作成機能

**Feature Branch**: `001-event-creation`
**Created**: 2025-11-11
**Status**: Draft

このドキュメントは、フェーズ1：イベント作成機能の開発環境セットアップと実行手順を提供します。

---

## 前提条件

開発を始める前に、以下のツールがインストールされていることを確認してください:

- **Node.js**: v20.x以上
- **npm**: v10.x以上（またはpnpm v9.x以上）
- **Git**: v2.x以上
- **Supabase CLI**: v1.x以上

### インストール確認

```bash
node --version  # v20.0.0以上
npm --version   # v10.0.0以上
git --version   # v2.0.0以上
supabase --version  # v1.0.0以上
```

### Supabase CLIのインストール

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux / macOS (npm)
npm install -g supabase
```

---

## 1. プロジェクトセットアップ

### 1.1 リポジトリのクローン

```bash
# リポジトリをクローン
git clone <repository-url>
cd YURUBO

# フェーズ1ブランチに切り替え
git checkout 001-event-creation
```

### 1.2 依存パッケージのインストール

```bash
# Next.js 15プロジェクトの依存関係をインストール
npm install

# インストールされる主要なパッケージ:
# - next@15.x: Next.js本体
# - react@19.x: React本体
# - @supabase/supabase-js: Supabase JavaScriptクライアント
# - @supabase/ssr: Supabase Server-Side Rendering用ヘルパー
# - zod: バリデーションライブラリ
# - react-hook-form: フォーム管理
# - @hookform/resolvers: Zodとの統合
# - @tanstack/react-query: データフェッチング・キャッシュ
# - react-intersection-observer: 無限スクロール用
# - tailwindcss: CSSフレームワーク
# - typescript: 型安全性
```

**package.jsonの確認**:

```json
{
  "name": "yurubo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:status": "supabase status",
    "supabase:reset": "supabase db reset"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "@tanstack/react-query": "^5.17.0",
    "react-intersection-observer": "^9.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.0.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@playwright/test": "^1.40.0"
  }
}
```

---

## 2. Supabaseローカル環境のセットアップ

### 2.1 Supabaseプロジェクトの初期化

```bash
# Supabaseローカル開発環境を初期化
supabase init

# これにより以下のディレクトリが作成されます:
# supabase/
# ├── config.toml          # Supabase設定ファイル
# ├── migrations/          # データベースマイグレーションファイル
# └── seed.sql             # 初期データ（テストデータ）
```

### 2.2 Supabaseローカルサーバーの起動

```bash
# Dockerを使用してSupabaseローカルサーバーを起動
supabase start

# 起動完了後、以下の情報が表示されます:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - anon key: <匿名キー>
# - service_role key: <サービスロールキー>
```

**注意**: 初回起動時はDockerイメージのダウンロードに時間がかかる場合があります。

### 2.3 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.example .env.local
```

**.env.local**:

```bash
# Supabase設定（ローカル開発環境）
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase startで表示された匿名キー>

# 本番環境の場合（デプロイ時）
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<本番環境の匿名キー>
```

**重要**: `.env.local`は`.gitignore`に含まれており、Gitにコミットされません。

---

## 3. データベースマイグレーションの実行

### 3.1 マイグレーションファイルの確認

以下のマイグレーションファイルが`supabase/migrations/`に存在することを確認します:

```bash
supabase/migrations/
├── 00001_create_categories_table.sql
├── 00002_create_users_table.sql
├── 00003_create_events_table.sql
├── 00004_create_connections_table.sql
├── 00005_enable_rls_policies.sql
└── 00006_create_triggers_and_functions.sql
```

### 3.2 マイグレーションの実行

```bash
# データベースをリセットし、すべてのマイグレーションを実行
supabase db reset

# 成功すると以下のように表示されます:
# Applying migration 00001_create_categories_table.sql...
# Applying migration 00002_create_users_table.sql...
# Applying migration 00003_create_events_table.sql...
# Applying migration 00004_create_connections_table.sql...
# Applying migration 00005_enable_rls_policies.sql...
# Applying migration 00006_create_triggers_and_functions.sql...
# Finished supabase db reset.
```

### 3.3 データベースの確認

```bash
# Supabase Studioを開く（ブラウザで確認）
open http://localhost:54323

# または、PostgreSQLクライアントで接続
psql postgresql://postgres:postgres@localhost:54322/postgres
```

**Supabase Studioでの確認**:
1. 左サイドバーの「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認:
   - categories
   - users
   - events
   - connections

---

## 4. 開発サーバーの起動

### 4.1 Next.js開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# サーバーが起動すると以下のように表示されます:
# ▲ Next.js 15.0.0
# - Local:        http://localhost:3000
# - Environments: .env.local
# ✓ Ready in 2.5s
```

### 4.2 ブラウザでアクセス

```bash
# ブラウザで開く
open http://localhost:3000
```

**初回アクセス時の画面**:
- ログインページが表示されます
- テストユーザーでログイン可能（後述）

---

## 5. テストデータの投入

### 5.1 テストユーザーの作成

```bash
# Supabase Studioでユーザーを作成
open http://localhost:54323/project/default/auth/users

# または、SQLで直接作成
psql postgresql://postgres:postgres@localhost:54322/postgres
```

**SQLでのテストユーザー作成**:

```sql
-- テストユーザー1を作成
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440001',
  'authenticated',
  'authenticated',
  'test1@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW()
);

-- テストユーザー1のプロフィール作成
INSERT INTO users (id, display_name, enabled_categories) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'テストユーザー1',
  ARRAY['drinking', 'travel', 'tennis']
);

-- テストユーザー2を作成
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440002',
  'authenticated',
  'authenticated',
  'test2@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW()
);

-- テストユーザー2のプロフィール作成
INSERT INTO users (id, display_name, enabled_categories) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'テストユーザー2',
  ARRAY['drinking', 'tennis', 'other']
);
```

### 5.2 つながりリストの作成

```sql
-- テストユーザー1 → テストユーザー2へのつながり
INSERT INTO connections (user_id, target_id, category_flags) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '{"drinking": true, "travel": true, "tennis": true, "other": false}'::jsonb
);

-- テストユーザー2 → テストユーザー1へのつながり
INSERT INTO connections (user_id, target_id, category_flags) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  '{"drinking": true, "travel": false, "tennis": true, "other": false}'::jsonb
);
```

### 5.3 テストイベントの作成

```sql
-- テストイベント1（飲み）
INSERT INTO events (
  category, title, anon_id, date_start, date_end,
  capacity_min, capacity_max, price_min, price_max,
  comment, host_id
) VALUES (
  'drinking',
  '軽く飲みませんか?',
  '🍶A',
  '2025-11-15 19:00:00+09',
  '2025-11-15 22:00:00+09',
  3, 5, 3000, 5000,
  '仕事終わりに軽く一杯どうですか?',
  '550e8400-e29b-41d4-a716-446655440001'
);

-- テストイベント2（旅行）
INSERT INTO events (
  category, title, anon_id, date_start, date_end,
  capacity_min, capacity_max, price_min, price_max,
  comment, host_id, deadline
) VALUES (
  'travel',
  '温泉旅行に行きませんか?',
  '✈️A',
  '2025-12-01 09:00:00+09',
  '2025-12-03 18:00:00+09',
  4, 8, 20000, 30000,
  '箱根の温泉に2泊3日で行きませんか?',
  '550e8400-e29b-41d4-a716-446655440001',
  '2025-11-25 23:59:59+09'
);

-- テストイベント3（テニス）
INSERT INTO events (
  category, title, anon_id, date_start, date_end,
  capacity_min, capacity_max, price_min, price_max,
  comment, host_id
) VALUES (
  'tennis',
  'テニスしませんか?',
  '🎾A',
  '2025-11-20 14:00:00+09',
  '2025-11-20 16:00:00+09',
  2, 4, 1000, 2000,
  '初心者歓迎！軽く打ちましょう',
  '550e8400-e29b-41d4-a716-446655440002'
);
```

### 5.4 テストデータの確認

```bash
# ブラウザでタイムラインを確認
open http://localhost:3000

# ログイン情報:
# - Email: test1@example.com
# - Password: password123
```

**期待される画面**:
- タイムラインに3件のイベントが表示される
- 各イベントに匿名ID（🍶A、✈️A、🎾A）が表示される
- 投稿者の実名は表示されない

---

## 6. テストの実行

### 6.1 単体テスト（Jest）

```bash
# すべての単体テストを実行
npm test

# 監視モード（ファイル変更時に自動再実行）
npm run test:watch

# カバレッジレポート生成
npm test -- --coverage
```

**テストファイルの配置**:
- `lib/utils/generateAnonId.test.ts`: 匿名ID生成ロジック
- `lib/validations/event.test.ts`: Zodバリデーションスキーマ
- `app/actions/createEvent.test.ts`: イベント作成Server Action

### 6.2 統合テスト（Jest + Supabase）

```bash
# 統合テストを実行
npm test -- --testPathPattern=integration

# 例:
# - app/actions/createEvent.integration.test.ts
# - app/actions/updateEvent.integration.test.ts
```

### 6.3 E2Eテスト（Playwright）

```bash
# Playwrightブラウザをインストール（初回のみ）
npx playwright install

# E2Eテストを実行
npm run test:e2e

# ヘッドレスモードで実行（CI環境用）
npm run test:e2e -- --headed

# 特定のテストファイルのみ実行
npm run test:e2e -- tests/e2e/event-creation.spec.ts
```

**E2Eテストファイルの配置**:
- `tests/e2e/event-creation.spec.ts`: イベント作成フロー
- `tests/e2e/timeline.spec.ts`: タイムライン閲覧
- `tests/e2e/event-edit.spec.ts`: イベント編集

---

## 7. よくある問題と解決方法

### 7.1 Supabaseが起動しない

**問題**: `supabase start`でエラーが発生する

**解決方法**:
```bash
# Dockerが起動しているか確認
docker ps

# Supabaseを停止して再起動
supabase stop
supabase start

# Dockerコンテナをクリーンアップ
docker system prune -a
```

### 7.2 環境変数が反映されない

**問題**: `.env.local`の設定が反映されない

**解決方法**:
```bash
# Next.jsサーバーを再起動
# Ctrl+Cで停止 → npm run devで再起動

# 環境変数を確認
echo $NEXT_PUBLIC_SUPABASE_URL
```

### 7.3 RLSポリシーでアクセス拒否される

**問題**: タイムラインでイベントが表示されない

**解決方法**:
```sql
-- RLSポリシーが有効になっているか確認
SELECT * FROM pg_policies WHERE tablename = 'events';

-- テストユーザーでログインしているか確認
SELECT auth.uid();

-- つながりリストが正しく設定されているか確認
SELECT * FROM connections WHERE user_id = auth.uid();
```

### 7.4 マイグレーションが失敗する

**問題**: `supabase db reset`でエラーが発生する

**解決方法**:
```bash
# マイグレーションファイルの構文エラーを確認
cat supabase/migrations/00001_create_categories_table.sql

# データベースを完全にリセット
supabase db reset --no-seed

# 特定のマイグレーションのみ実行
supabase migration up --version <version>
```

---

## 8. 開発ワークフロー

### 8.1 ブランチ戦略

```bash
# 新機能開発時は001-event-creationから派生
git checkout 001-event-creation
git pull origin 001-event-creation
git checkout -b feature/your-feature-name

# 作業完了後、001-event-creationにマージ
git checkout 001-event-creation
git merge feature/your-feature-name
```

### 8.2 コミット前のチェック

```bash
# 型チェック
npm run type-check

# リントチェック
npm run lint

# すべてのテストを実行
npm test
npm run test:e2e

# ビルドチェック
npm run build
```

### 8.3 コード品質の維持

**TypeScript strict mode**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**ESLint設定**:
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

---

## 9. デバッグとロギング

### 9.1 Next.js開発ツール

```bash
# 開発サーバーのログを詳細表示
DEBUG=* npm run dev

# ビルド時のログを詳細表示
npm run build -- --debug
```

### 9.2 Supabaseデバッグ

```bash
# Supabaseログを確認
supabase logs

# 特定のサービスのログを確認
supabase logs --service postgres
supabase logs --service postgrest
supabase logs --service realtime
```

### 9.3 ブラウザ開発者ツール

**React Developer Tools**:
- [Chrome拡張機能](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- コンポーネントツリーの確認
- PropsとStateのデバッグ

**Network タブ**:
- Supabase APIリクエストの確認
- エラーレスポンスの確認

---

## 10. 追加リソース

### 10.1 公式ドキュメント

- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [React Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zod](https://zod.dev/)

### 10.2 プロジェクトドキュメント

- [仕様書](./spec.md)
- [データモデル](./data-model.md)
- [API契約](./contracts/api.yaml)
- [リサーチ](./research.md)
- [技術計画](../../docs/techplan.md)

---

## 11. サポート

問題が発生した場合は、以下の手順で対応してください:

1. **エラーメッセージを確認**: ターミナルやブラウザコンソールのエラーメッセージを確認
2. **ドキュメントを確認**: 本ドキュメントや公式ドキュメントを確認
3. **ログを確認**: Supabase Studio、Next.jsログ、ブラウザNetwork タブを確認
4. **環境をリセット**: Supabaseとデータベースをリセット（`supabase db reset`）
5. **チームに相談**: Slack、Issue、Pull Requestで相談

---

これで開発環境のセットアップは完了です。`npm run dev`でサーバーを起動し、開発を開始してください！
