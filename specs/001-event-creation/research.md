# Research: フェーズ1：イベント作成機能

**Feature Branch**: `001-event-creation`
**Created**: 2025-11-11
**Status**: Completed

このドキュメントは、イベント作成機能の実装に向けた技術調査結果をまとめたものです。

---

## 1. Next.js 15 App Router + Supabaseのベストプラクティス

### Decision

- **Server Components**: データフェッチ、初期レンダリング、SEOが重要な箇所に使用
- **Client Components**: インタラクティブなUI（フォーム、モーダル、無限スクロール）に使用
- **Server Actions**: フォーム送信、イベント作成・編集などのミューテーション操作に使用
- **API Routes**: Webhookやサードパーティ連携など外部システムとの統合に使用
- **Supabase RLS**: Row-Level Securityでつながりリストベースのアクセス制御を実装

### Rationale

**Server Components vs Client Components**:
- Server Componentsはサーバーサイドで実行され、クライアントへのJavaScript送信量を削減
- タイムラインの初期データ取得など、インタラクション不要な箇所に最適
- Client Componentsは`"use client"`ディレクティブで明示的に宣言し、`useState`, `useEffect`などReact Hooksを使用可能

**Server Actions vs API Routes**:
- Server Actionsは`"use server"`ディレクティブでサーバーサイド関数を定義し、クライアントから直接呼び出し可能
- フォーム送信やCRUD操作に最適（型安全性が高く、ボイラープレートが少ない）
- API Routesは外部システム連携（Stripe Webhook、OpenAI API呼び出し）やRESTful APIが必要な場合に使用

**Supabase RLS**:
- PostgreSQLのRow-Level Security機能を使い、データベースレベルでアクセス制御
- `connections`テーブルの`category_flags`（JSONB）を参照して、つながりリスト内のユーザーのみがイベントを閲覧可能にする
- アプリケーションコード側でアクセス制御を実装するより安全で保守性が高い

### Alternatives considered

1. **すべてをAPI Routesで実装**: Next.js 13以前のアプローチだが、ボイラープレートが多くなる
2. **すべてをClient Componentsで実装**: 初期ロードが遅くなり、SEOに悪影響
3. **アプリケーション層でアクセス制御**: データベースレベルの防御がなく、セキュリティリスクが高い

### Implementation notes

**ディレクトリ構造例**:
```
app/
├── page.tsx                    # Server Component: タイムライン初期表示
├── components/
│   ├── EventTimeline.tsx       # Client Component: 無限スクロール
│   ├── EventPostModal.tsx      # Client Component: 投稿モーダル
│   └── EventCard.tsx           # Server Component: イベントカード表示
├── actions/
│   ├── createEvent.ts          # Server Action: イベント作成
│   └── updateEvent.ts          # Server Action: イベント編集
└── api/
    └── webhooks/
        └── stripe/route.ts     # API Route: Stripe Webhook
```

**Supabase RLSポリシー例**:
```sql
-- eventsテーブル: つながりリスト内のカテゴリOKユーザーのみ閲覧可
CREATE POLICY "events_select_policy" ON events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM connections
    WHERE connections.user_id = events.host_id
      AND connections.target_id = auth.uid()
      AND connections.category_flags->>events.category = 'true'
  )
  OR events.host_id = auth.uid()  -- 自分の投稿は常に閲覧可
);
```

**参考**:
- [Next.js 15 App Router公式ドキュメント](https://nextjs.org/docs/app)
- [Supabase RLS公式ドキュメント](https://supabase.com/docs/guides/auth/row-level-security)

---

## 2. 匿名ID生成とカテゴリ別絵文字マッピング

### Decision

- **匿名ID形式**: `{カテゴリ絵文字}{連番アルファベット}`(例: 🍶A, ✈️B, 🎾C)
- **連番管理**: ユーザーごとに各カテゴリの投稿順にA, B, C...と付与
- **絵文字マッピング**: 定数ファイルでカテゴリ→絵文字の対応を定義
- **ID生成ロジック**: イベント作成時にServer Actionで自動生成
- **実装方法**: イベント作成時に該当カテゴリの既存投稿数をカウントし、その連番から匿名IDを生成

### Rationale

**カテゴリ別絵文字**:
- spec.mdの要件（FR-005）に基づき、視覚的にカテゴリを識別可能にする
- 絵文字は日本語環境で広く認識されており、UXを向上させる

**連番管理**:
- 同一ユーザーが同一カテゴリで複数投稿する場合、投稿順にA, B, C...と付与
- ユーザーごとにカテゴリ別の投稿カウントを`events`テーブルからクエリで取得
- 削除されたイベントは連番に影響しない（歯抜けになる可能性があるが、ユーザー体験への影響は軽微）

**自動生成**:
- 手動入力によるエラーを防ぎ、一貫性を保証
- イベント作成時にサーバーサイドで生成することでセキュリティを確保
- カウントベースの連番生成により、実装がシンプルで保守性が高い

### Alternatives considered

1. **ランダムなハッシュID**: 匿名性は高いが、ユーザーにとって識別しづらい
2. **ユーザーが手動で設定**: 入力ミスや不適切な名前のリスク
3. **絵文字なし**: カテゴリ識別が困難になる
4. **Fakerライブラリを使用した映画キャラクター名**: 「有名な映画の登場人物」を使った匿名化案もあったが、以下の理由で不採用:
   - キャラクター名の選定基準が曖昧（どの映画が「有名」か）
   - ライブラリに依存するとカスタマイズが困難
   - 絵文字+連番の方がシンプルで視覚的に識別しやすい

### Implementation notes

**カテゴリ絵文字マッピング定数**:
```typescript
// lib/constants/categories.ts
export const CATEGORY_EMOJIS: Record<string, string> = {
  drinking: '🍶',
  travel: '✈️',
  tennis: '🎾',
  other: '📌',
} as const;

export const CATEGORIES = [
  { value: 'drinking', label: '飲み', emoji: '🍶' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'tennis', label: 'テニス', emoji: '🎾' },
  { value: 'other', label: 'その他', emoji: '📌' },
] as const;
```

**匿名ID生成ロジック**:
```typescript
// lib/utils/generateAnonId.ts
import { CATEGORY_EMOJIS } from '@/lib/constants/categories';

/**
 * カテゴリと連番から匿名IDを生成
 * @param category - イベントカテゴリ
 * @param sequence - ユーザーごとの連番（0から開始）
 * @returns 匿名ID（例: 🍶A）
 */
export function generateAnonId(category: string, sequence: number): string {
  const emoji = CATEGORY_EMOJIS[category] || '📌';
  const letter = String.fromCharCode(65 + sequence); // 65 = 'A'
  return `${emoji}${letter}`;
}
```

**連番管理方法**:
```typescript
// Server Action内での実装例
// app/actions/createEvent.ts

// TODO: ユーザーの該当カテゴリでの投稿数を取得
const { count } = await supabase
  .from('events')
  .select('id', { count: 'exact', head: true })
  .eq('host_id', userId)
  .eq('category', category);

// TODO: 匿名IDを生成
const anonId = generateAnonId(category, count || 0);

// TODO: イベント作成時にanon_idを保存
await supabase.from('events').insert({
  ...eventData,
  anon_id: anonId,
  host_id: userId,
});
```

**参考**:
- [Unicode Emoji List](https://unicode.org/emoji/charts/full-emoji-list.html)

---

## 3. 無限スクロール実装（React + Supabase）

### Decision

- **ライブラリ**: `@tanstack/react-query`（React Query v5）の`useInfiniteQuery`フック
- **ページネーション方式**: Cursor-based pagination（`range()`を使用）
- **読み込み単位**: 20件ずつ（spec.md FR-012に基づく）
- **スクロール検知**: `react-intersection-observer`でビューポート到達を検知

### Rationale

**React Query**:
- データフェッチング、キャッシング、再検証を自動管理
- `useInfiniteQuery`は無限スクロールに特化した機能を提供
- Supabaseとの統合が容易

**Cursor-based pagination**:
- Offset-based（`OFFSET`/`LIMIT`）より高速で、データ追加時の重複リスクが低い
- Supabaseの`range(start, end)`を使用して効率的にページング
- 例: `range(0, 19)` → 最初の20件、`range(20, 39)` → 次の20件

**react-intersection-observer**:
- スクロール位置の検知が軽量で、パフォーマンスに優れる
- ビューポートに到達したタイミングで自動的に次ページを読み込み

### Alternatives considered

1. **Offset-based pagination**: シンプルだが、データ量が増えるとパフォーマンスが低下
2. **手動スクロールイベント**: `onScroll`イベントを使用するが、パフォーマンスが悪い
3. **SWR**: React Queryと同様の機能だが、無限スクロールのサポートがやや弱い

### Implementation notes

**React Queryセットアップ**:
```typescript
// app/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1分間キャッシュ有効
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**無限スクロール実装例**:
```typescript
// app/components/EventTimeline.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const EVENTS_PER_PAGE = 20;

export function EventTimeline() {
  const supabase = createClient();
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['events'],
    queryFn: async ({ pageParam = 0 }) => {
      const start = pageParam * EVENTS_PER_PAGE;
      const end = start + EVENTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // TODO: 最後のページが空または20件未満なら終了
      if (!lastPage || lastPage.length < EVENTS_PER_PAGE) return undefined;
      return allPages.length; // 次のページ番号
    },
    initialPageParam: 0,
  });

  // TODO: ビューポート到達時に次ページを読み込み
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.map((page) =>
        page.map((event) => (
          <EventCard key={event.id} event={event} />
        ))
      )}
      {/* ローディングトリガー */}
      <div ref={ref}>{isFetchingNextPage && 'Loading...'}</div>
    </div>
  );
}
```

**パフォーマンス最適化**:
- `staleTime`を設定して不要な再フェッチを防ぐ
- `refetchOnWindowFocus`を無効化してバックグラウンド時の再読み込みを抑制
- データ量が多い場合は仮想スクロール（`react-virtual`）の導入を検討

**参考**:
- [React Query Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [Supabase Range Pagination](https://supabase.com/docs/guides/database/postgres/pagination)
- [react-intersection-observer](https://www.npmjs.com/package/react-intersection-observer)

---

## 4. Zodバリデーションスキーマの設計

### Decision

- **スキーマ配置**: `lib/validations/`に共通スキーマを配置し、フロントエンド・バックエンドで再利用
- **フロントエンド**: React Hook Formと`@hookform/resolvers/zod`で統合
- **バックエンド**: Server Action内で同じスキーマを使って再バリデーション
- **エラーメッセージ**: Zodの`.message()`で日本語メッセージをカスタマイズ

### Rationale

**スキーマ再利用**:
- フロントエンドとバックエンドで同じバリデーションロジックを使用し、重複を排除
- 型安全性が高く、バリデーションルールの変更が一箇所で完結

**React Hook Form統合**:
- `useForm`の`resolver`オプションでZodスキーマを指定することで、自動的にバリデーション実行
- エラーメッセージを`formState.errors`から取得可能

**サーバーサイド再バリデーション**:
- クライアント側のバリデーションは改ざん可能なため、Server Action内で再度検証が必須
- Zodの`.safeParse()`を使ってエラーハンドリングを実装

### Alternatives considered

1. **Yup**: Zodと同様の機能だが、TypeScript型推論が弱い
2. **手動バリデーション**: 保守性が低く、エラーが発生しやすい
3. **フロントエンドのみバリデーション**: セキュリティリスクが高い

### Implementation notes

**Zodスキーマ定義**:
```typescript
// lib/validations/event.ts
import { z } from 'zod';

export const eventSchema = z.object({
  category: z.enum(['drinking', 'travel', 'tennis', 'other'], {
    required_error: 'カテゴリを選択してください',
  }),
  date_start: z.date({
    required_error: '開催開始日時を入力してください',
  }).refine((date) => date > new Date(), {
    message: '開催日時は現在より未来の日時を指定してください',
  }),
  date_end: z.date({
    required_error: '開催終了日時を入力してください',
  }),
  capacity_min: z.number().int().min(1, '最小人数は1人以上である必要があります'),
  capacity_max: z.number().int().min(1, '最大人数は1人以上である必要があります'),
  price_min: z.number().int().min(0).optional(),
  price_max: z.number().int().min(0).optional(),
  comment: z.string().max(500, 'コメントは500文字以内で入力してください').optional(),
  deadline: z.date().optional(),
}).refine((data) => data.date_end > data.date_start, {
  message: '終了時刻は開始時刻より後に設定してください',
  path: ['date_end'],
}).refine((data) => data.capacity_max >= data.capacity_min, {
  message: '最小人数は最大人数以下である必要があります',
  path: ['capacity_min'],
}).refine((data) => {
  if (data.deadline) {
    return data.deadline < data.date_start;
  }
  return true;
}, {
  message: '受付締切は開催開始時刻より前に設定してください',
  path: ['deadline'],
});

export type EventFormData = z.infer<typeof eventSchema>;
```

**フロントエンド統合（React Hook Form）**:
```typescript
// app/components/EventPostModal.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventFormData } from '@/lib/validations/event';

export function EventPostModal() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const onSubmit = async (data: EventFormData) => {
    // TODO: Server Actionを呼び出し
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* フォームフィールド */}
      {errors.category && <p>{errors.category.message}</p>}
    </form>
  );
}
```

**バックエンド統合（Server Action）**:
```typescript
// app/actions/createEvent.ts
'use server';

import { eventSchema } from '@/lib/validations/event';

export async function createEvent(formData: FormData) {
  // TODO: FormDataをオブジェクトに変換
  const rawData = Object.fromEntries(formData);

  // TODO: Zodでバリデーション
  const result = eventSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      message: result.error.errors[0].message,
      code: 'VALIDATION_ERROR',
    };
  }

  // TODO: データベースに保存
  // ...
}
```

**日本語エラーメッセージのカスタマイズ**:
- Zodの`.message()`オプションで各バリデーションルールにメッセージを指定
- spec.md FR-016の要件に基づき、すべてのエラーメッセージを日本語化

**参考**:
- [Zod公式ドキュメント](https://zod.dev/)
- [React Hook Form公式ドキュメント](https://react-hook-form.com/)
- [@hookform/resolvers](https://www.npmjs.com/package/@hookform/resolvers)

---

## 5. つながりリストのデータモデル設計

### Decision

- **connectionsテーブル構造**:
  - `user_id`: つながりを設定したユーザー
  - `target_id`: つながり対象のユーザー
  - `category_flags`: JSONB型、カテゴリごとのOK/NGフラグ
- **category_flagsスキーマ**: `{ "drinking": true, "travel": false, "tennis": true, "other": false }`
- **初期状態**: ユーザー自身が有効にしているカテゴリをデフォルトON
- **RLSポリシー**: JSONB演算子（`->>`）を使ってカテゴリフラグを参照

### Rationale

**JSONB型の採用**:
- PostgreSQLのJSONB型はインデックスをサポートし、柔軟なクエリが可能
- カテゴリが将来的に増えてもスキーマ変更不要
- JSONBインデックス（GINインデックス）により高速検索が可能

**初期状態の設計**:
- spec.mdの要件に基づき、ユーザー自身が有効にしているカテゴリをデフォルトON
- つながり追加時に個別にOFF設定可能（ユーザーが明示的に変更）

**RLSポリシーでのJSONB参照**:
- PostgreSQLの`->>` 演算子でJSONBフィールドの値を文字列として取得
- 例: `category_flags->>'drinking' = 'true'`

### Alternatives considered

1. **正規化テーブル**: カテゴリごとに別テーブルを作成するが、スキーマが複雑化
2. **ビットマスク**: カテゴリフラグをビット演算で管理するが、可読性が低い
3. **配列型**: JSONB型より柔軟性が低く、クエリが複雑

### Implementation notes

**connectionsテーブル定義**:
```sql
-- Supabase Migration
CREATE TABLE connections (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_flags JSONB NOT NULL DEFAULT '{
    "drinking": false,
    "travel": false,
    "tennis": false,
    "other": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, target_id)
);

-- JSONBインデックス（高速検索用）
CREATE INDEX idx_connections_category_flags ON connections USING GIN (category_flags);
```

**初期状態の実装**:
```typescript
// Server Action: つながり追加時
// app/actions/addConnection.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function addConnection(targetId: string) {
  const supabase = createClient();

  // TODO: 現在のユーザーの有効カテゴリを取得
  const { data: user } = await supabase
    .from('users')
    .select('enabled_categories')
    .eq('id', userId)
    .single();

  // TODO: 初期category_flagsを生成（ユーザーの有効カテゴリをON）
  const initialFlags = {
    drinking: user.enabled_categories.includes('drinking'),
    travel: user.enabled_categories.includes('travel'),
    tennis: user.enabled_categories.includes('tennis'),
    other: user.enabled_categories.includes('other'),
  };

  // TODO: つながりを作成
  await supabase.from('connections').insert({
    user_id: userId,
    target_id: targetId,
    category_flags: initialFlags,
  });
}
```

**RLSポリシーでのJSONB参照**:
```sql
-- eventsテーブル: つながりリスト内のカテゴリOKユーザーのみ閲覧可
CREATE POLICY "events_select_policy" ON events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM connections
    WHERE connections.user_id = events.host_id
      AND connections.target_id = auth.uid()
      AND (connections.category_flags->>events.category)::boolean = true
  )
  OR events.host_id = auth.uid()  -- 自分の投稿は常に閲覧可
);
```

**JSONB更新操作**:
```typescript
// つながりのカテゴリフラグを更新
await supabase
  .from('connections')
  .update({
    category_flags: {
      drinking: true,
      travel: false,
      tennis: true,
      other: false,
    },
  })
  .eq('user_id', userId)
  .eq('target_id', targetId);
```

**パフォーマンス最適化**:
- GINインデックスを使用してJSONBフィールドの検索を高速化
- 頻繁にアクセスされるカテゴリフラグは部分インデックスを検討

**参考**:
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase JSONB Guide](https://supabase.com/docs/guides/database/json)
- [GIN Index](https://www.postgresql.org/docs/current/gin-intro.html)

---

## まとめ

このリサーチにより、以下の技術的方向性が確立されました:

1. **Next.js 15 App Router**: Server Components/Client Componentsを適切に使い分け、Server Actionsで型安全なデータ操作を実現
2. **匿名ID生成**: カテゴリ絵文字+連番アルファベットで一貫性のある匿名化を実装
3. **無限スクロール**: React Queryの`useInfiniteQuery`とCursor-based paginationで高速かつ効率的な実装
4. **Zodバリデーション**: フロントエンド・バックエンドで共通スキーマを使用し、日本語エラーメッセージで優れたUXを提供
5. **つながりリスト**: JSONB型でカテゴリフラグを管理し、RLSポリシーで安全なアクセス制御を実現

次のステップは、これらの技術選択に基づいて実装計画（plan.md）を策定することです。
