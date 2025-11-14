# T074-T086: タイムライン閲覧機能の実装

**Epic**: 001 - イベント作成機能
**User Story**: US2 - タイムライン閲覧機能
**関連ファイル**:
- `lib/services/timeline.service.ts`
- `lib/services/timeline.service.test.ts`
- `app/actions/fetchTimeline.ts`
- `app/actions/fetchTimeline.test.ts`
- `components/events/EventTimeline.tsx`
- `components/events/EventTimeline.test.tsx`
- `app/page.tsx`

**実装日**: 2025-11-14

---

## 実装概要

**User Story 2**: タイムライン閲覧機能

> つながりリストに登録されたユーザーの募集中イベントを新しい順にタイムライン形式で閲覧できる機能。無限スクロールによって、スムーズなユーザー体験を提供する。

**目的**:
- つながりリストのユーザーが投稿したイベントを自動的にフィルタリングして表示する
- 無限スクロールによってユーザーが快適にイベント一覧を閲覧できる
- RLS（Row-Level Security）を活用して、認可処理をデータベース層で実現する

**成果物**:
- タイムライン取得サービス（`timeline.service.ts`）
- Server Action（`fetchTimeline.ts`）
- タイムラインUIコンポーネント（`EventTimeline.tsx`）
- 単体・統合テスト（各`.test.ts`ファイル）
- ホーム画面へのタイムライン統合（`page.tsx`）

---

## 技術解説

### 使用技術スタック

| 技術 | 用途 | 公式ドキュメント |
|------|------|------------------|
| Next.js 15 App Router | Server Actions、Client Components | [Next.js Docs](https://nextjs.org/docs) |
| Supabase Client | データベースアクセス、RLS | [Supabase Docs](https://supabase.com/docs) |
| Intersection Observer API | 無限スクロール実装 | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) |
| React Hooks | useEffect, useCallback, useRef | [React Docs](https://react.dev/reference/react) |
| TypeScript | 型安全性 | [TypeScript Docs](https://www.typescriptlang.org/docs/) |
| Jest | 単体・統合テスト | [Jest Docs](https://jestjs.io/docs/getting-started) |

### 重要な文法・パターン

#### 文法1: Server Actions

```typescript
'use server'

export async function fetchTimeline(params: FetchTimelineParams): Promise<ActionResult> {
  // サーバーサイドでのみ実行される処理
  const supabase = await createClient()
  // ...
}
```

**解説**:
- `'use server'`ディレクティブでサーバーサイド実行を明示
- クライアントからはRPC（Remote Procedure Call）のように呼び出せる
- フォーム送信やイベントハンドラーから直接呼び出し可能
- データフェッチ、データベース操作、認証など、サーバーサイドでのみ行うべき処理に使用

#### 文法2: Intersection Observer API

```typescript
const observerRef = useRef<IntersectionObserver | null>(null)
const loadMoreRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  observerRef.current = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMore()
      }
    },
    { threshold: 0.1 }
  )

  if (loadMoreRef.current) {
    observerRef.current.observe(loadMoreRef.current)
  }

  return () => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }
}, [loadMore, hasMore, isLoading])
```

**解説**:
- スクロール位置を監視して、指定要素が画面に入ったときにイベントを発火
- `threshold: 0.1`は、要素が10%見えたら発火することを意味
- パフォーマンスが良く、無限スクロールの実装に最適
- `useEffect`のクリーンアップ関数で`disconnect()`を呼び出してメモリリークを防止

#### パターン1: ページネーションロジック

```typescript
// ページ番号とlimitから取得範囲を計算
const from = page * limit
const to = from + limit - 1

const { data: events } = await supabase
  .from('events')
  .select('*')
  .range(from, to)

// 次のページが存在するか判定
const hasMore = events.length === limit
```

**解説**:
- `page=0, limit=20`なら`range(0, 19)`で最初の20件を取得
- `page=1, limit=20`なら`range(20, 39)`で次の20件を取得
- `hasMore`は、取得件数がlimitと同じなら`true`（まだデータがある可能性）
- limitより少なければ最後のページと判断

#### パターン2: RLS（Row-Level Security）によるフィルタリング

```typescript
// RLSポリシーによって自動的につながりリストベースでフィルタリング
const { data: events } = await supabase
  .from('events')
  .select('*')
  .eq('status', 'recruiting')
  .order('created_at', { ascending: false })
```

**解説**:
- Supabase RLSポリシーがデータベース層で認可処理を実行
- アプリケーションコードで明示的にJOINやWHERE句を書く必要がない
- セキュリティ処理がデータベース層に集約されるため、ビジネスロジックがシンプルになる
- `status='recruiting'`で募集中イベントのみに絞り込み

---

## 実装手順

### ステップ1: タイムライン取得サービスの実装

**目的**: つながりリストのイベントを取得するビジネスロジックを実装

```typescript
// lib/services/timeline.service.ts
export async function fetchTimeline(
  supabase: SupabaseClient<Database>,
  params: FetchTimelineParams = {}
): Promise<FetchTimelineResult> {
  const { page = 0, limit = 20 } = params

  // ステップ1: 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      data: [],
      error: 'UNAUTHORIZED',
      hasMore: false,
    }
  }

  // ステップ2: ページネーション範囲を計算
  const from = page * limit
  const to = from + limit - 1

  // ステップ3: RLSポリシーでフィルタリングされたイベントを取得
  const { data: events, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'recruiting')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (fetchError) {
    return {
      data: [],
      error: 'FETCH_ERROR',
      hasMore: false,
    }
  }

  // ステップ4: hasMoreを計算
  const hasMore = events.length === limit

  return {
    data: events,
    error: null,
    hasMore,
  }
}
```

**ポイント**:
- 認証チェックを最初に実行して、未認証ユーザーを早期にリジェクト
- ページネーション計算を明示的に行い、rangeでデータベースから取得
- エラーハンドリングを統一的に行い、エラーコードを返す

### ステップ2: Server Actionの実装

**目的**: クライアントから呼び出せるServer Actionを実装

```typescript
// app/actions/fetchTimeline.ts
'use server'

export async function fetchTimeline(params: FetchTimelineParams = {}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const result = await fetchTimelineService(supabase, params)

    if (result.error === 'UNAUTHORIZED') {
      return {
        success: false,
        message: 'ログインが必要です',
        code: 'UNAUTHORIZED',
      }
    }

    if (result.error === 'FETCH_ERROR') {
      return {
        success: false,
        message: 'タイムラインの取得に失敗しました',
        code: 'FETCH_ERROR',
      }
    }

    return {
      success: true,
      data: result.data,
      hasMore: result.hasMore,
      message: 'タイムラインを取得しました',
      code: 'SUCCESS',
    }
  } catch (error) {
    console.error('タイムライン取得エラー:', error)
    return {
      success: false,
      message: '予期しないエラーが発生しました',
      code: 'UNKNOWN_ERROR',
    }
  }
}
```

**ポイント**:
- サービス層からのエラーコードを統一されたレスポンス形式にマッピング
- `try-catch`で予期しないエラーをキャッチして、安全にエラーレスポンスを返す
- `success: true/false`で成功・失敗を明示

### ステップ3: タイムラインUIコンポーネントの実装

**目的**: 無限スクロール機能を持つタイムライン表示コンポーネントを実装

```typescript
// components/events/EventTimeline.tsx
'use client'

export function EventTimeline({ initialEvents = [], className }: EventTimelineProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [page, setPage] = useState(initialEvents.length > 0 ? 1 : 0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    const result = await fetchTimeline({ page, limit: 20 })

    if (result.success && result.data) {
      setEvents((prev) => [...prev, ...result.data!])
      setHasMore(result.hasMore ?? false)
      setPage((prev) => prev + 1)
    }

    setIsLoading(false)
  }, [page, isLoading, hasMore])

  useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, hasMore, isLoading])

  return (
    <div className={className}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
      {isLoading && <EventSkeleton />}
      {hasMore && <div ref={loadMoreRef} className="h-10" />}
    </div>
  )
}
```

**ポイント**:
- `useCallback`で`loadMore`をメモ化し、依存配列に必要な変数のみを指定
- Intersection Observerで画面下部の要素が表示されたら自動的に次のページを読み込み
- ローディング中は`EventSkeleton`を表示してユーザーに進捗を伝える

### ステップ4: ページ統合

**目的**: ホーム画面にタイムラインコンポーネントを統合

```typescript
// app/page.tsx
export default function HomePage() {
  const [timelineKey, setTimelineKey] = useState(0)

  const handleCreateEvent = async (data: CreateEventInput) => {
    const result = await createEvent(data)
    if (result.success) {
      setTimelineKey((prev) => prev + 1) // タイムラインを再読み込み
    }
  }

  return (
    <main>
      <EventTimeline key={timelineKey} />
      <PostEventModal onSubmit={handleCreateEvent} />
    </main>
  )
}
```

**ポイント**:
- `key={timelineKey}`によってコンポーネントを再マウントし、タイムラインを更新
- イベント作成後に自動的にタイムラインが更新される

---

## コード例

### Bad vs Good 比較

#### ❌ Bad: 手動でのスクロールイベントリスナー

```typescript
useEffect(() => {
  const handleScroll = () => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
      !isLoading &&
      hasMore
    ) {
      loadMore()
    }
  }

  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [isLoading, hasMore, loadMore])
```

**問題点**:
- スクロールイベントが頻繁に発火してパフォーマンスが悪い
- スロットリングやデバウンスを自分で実装する必要がある
- グローバルなスクロールイベントを使用するため、コンポーネントの独立性が低い

#### ✅ Good: Intersection Observer APIを使用

```typescript
const loadMoreRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMore()
      }
    },
    { threshold: 0.1 }
  )

  if (loadMoreRef.current) {
    observer.observe(loadMoreRef.current)
  }

  return () => observer.disconnect()
}, [loadMore, hasMore, isLoading])

// JSX
return <div ref={loadMoreRef} className="h-10" />
```

**改善点**:
- パフォーマンスが良い（ブラウザがネイティブで最適化）
- デバウンス・スロットリング不要
- コンポーネント独立性が高い

---

## テストケース

### 単体テスト（timeline.service.test.ts）

```typescript
it('つながりリストのイベントをRLSでフィルタリング', async () => {
  const mockSupabase = createMockSupabase()
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  mockSupabase.from().select().eq().order().range.mockResolvedValue({
    data: mockEvents,
    error: null,
  })

  const result = await fetchTimeline(mockSupabase, { page: 0, limit: 20 })

  expect(result.data).toEqual(mockEvents)
  expect(result.hasMore).toBe(true)
  expect(mockSupabase.from).toHaveBeenCalledWith('events')
})
```

**カバレッジ対象**:
- RLSフィルタリングの動作確認
- ページネーションロジック
- 認証エラーハンドリング
- データベースエラーハンドリング

### 統合テスト（fetchTimeline.test.ts）

```typescript
it('タイムライン取得成功時、{success: true, data, hasMore}を返す', async () => {
  const { fetchTimeline } = await import('@/app/actions/fetchTimeline')

  mockFetchTimelineService.mockResolvedValue({
    data: mockEvents,
    error: null,
    hasMore: true,
  })

  const result = await fetchTimeline({ page: 0, limit: 20 })

  expect(result.success).toBe(true)
  expect(result.data).toHaveLength(1)
  expect(result.hasMore).toBe(true)
})
```

**カバレッジ対象**:
- Server Actionの成功レスポンス
- エラーコードマッピング（UNAUTHORIZED, FETCH_ERROR）
- 予期しないエラーのハンドリング

### コンポーネントテスト（EventTimeline.test.tsx）

```typescript
it('initialEventsが渡された場合、初期表示する', () => {
  render(<EventTimeline initialEvents={mockEvents} />)

  expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument()
  expect(screen.getByText('軽く飲みませんか？')).toBeInTheDocument()
})

it('イベントが0件の場合、空状態メッセージを表示する', async () => {
  mockFetchTimeline.mockResolvedValue({
    success: true,
    data: [],
    hasMore: false,
  })

  render(<EventTimeline />)

  await waitFor(() => {
    expect(screen.getByText('まだイベントがありません')).toBeInTheDocument()
  })
})
```

**カバレッジ対象**:
- 初期イベント表示
- 空状態メッセージ
- ローディングスケルトン
- エラーメッセージ表示

---

## トラブルシューティング

### エラー1: Zodエラー `Property 'errors' does not exist on type 'ZodError'`

**症状**:
```
Property 'errors' does not exist on type 'ZodError'. Did you mean 'issues'?
```

**原因**:
- Zodのエラーオブジェクトは`errors`プロパティではなく`issues`プロパティを持つ
- 古いZodバージョンのドキュメントを参照していた

**解決方法**:
```typescript
// 修正前
message: validation.error.errors[0]?.message

// 修正後
message: validation.error.issues[0]?.message
```

### エラー2: Zodスキーマ `'required_error' does not exist`

**症状**:
```
Object literal may only specify known properties, and 'required_error' does not exist
```

**原因**:
- Zodの新しいバージョンでは`string()`の引数として`required_error`が使えない
- `message`プロパティを使用する必要がある

**解決方法**:
```typescript
// 修正前
z.string({ required_error: 'エラーメッセージ' })
  .uuid({ message: 'UUID形式が正しくありません' })

// 修正後
z.string({ message: 'エラーメッセージ' })
  .uuid('UUID形式が正しくありません')
```

### エラー3: 非同期cookie操作エラー

**症状**:
```
Property 'getAll' does not exist on type 'Promise<ReadonlyRequestCookies>'
```

**原因**:
- Next.js 15で`cookies()`がPromiseを返すようになった
- `await`せずに使用していた

**解決方法**:
```typescript
// 修正前
getAll() {
  return cookieStore.getAll()
}

// 修正後
async getAll() {
  return (await cookieStore).getAll()
}
```

### エラー4: 無限ループによるメモリリーク

**症状**:
- ページがフリーズする
- ブラウザのメモリ使用量が急激に増加

**原因**:
- Intersection Observerのクリーンアップ処理が不足
- useEffectの依存配列が不適切

**解決方法**:
1. useEffectでIntersection Observerを作成する際、必ずクリーンアップ関数で`disconnect()`を呼ぶ
2. `loadMore`関数を`useCallback`でメモ化する
3. 依存配列に`loadMore`, `hasMore`, `isLoading`を含める

```typescript
useEffect(() => {
  const observer = new IntersectionObserver(...)
  if (loadMoreRef.current) {
    observer.observe(loadMoreRef.current)
  }

  // クリーンアップ
  return () => observer.disconnect()
}, [loadMore, hasMore, isLoading]) // 依存配列を正しく指定
```

---

## 関連リソース

### 内部ドキュメント

- [spec.md](../../../specs/001-event-creation/spec.md) - User Story 2の仕様
- [plan.md](../../../specs/001-event-creation/plan.md) - 実装計画
- [tasks.md](../../../specs/001-event-creation/tasks.md) - T074-T086タスク

### 外部リソース

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) - Server Actionsの公式ドキュメント
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - 無限スクロールの実装方法
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security) - Row-Level Securityの設定方法
- [React useCallback](https://react.dev/reference/react/useCallback) - useCallbackの使い方

---

## 次のステップ

このタスクを完了したら、以下のタスクに進んでください:

- **T087-T093**: User Story 3（イベント詳細閲覧機能）の実装

**依存関係**:
- User Story 2の実装が完了しているため、User Story 3の実装が可能になります
- タイムラインから個別イベントへの遷移が可能になります
