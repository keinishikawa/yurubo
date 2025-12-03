# API Contracts: つながり管理（Connections）

**Feature**: Epic 000 - つながり管理
**Date**: 2025-12-03
**Implementation**: Next.js Server Actions

## 1. 概要

すべてのAPIはNext.js Server Actionsとして実装し、`app/actions/connections/` ディレクトリに配置する。

## 2. Server Actions

### 2.1 ユーザー検索

**ファイル**: `app/actions/connections/search-users.ts`

```typescript
/**
 * ユーザー検索
 * @spec FR-001: ユーザー名またはIDによる友人検索
 */
export async function searchUsers(
  query: string,
  options?: { limit?: number }
): Promise<SearchUsersResult>

// 入力
type SearchUsersInput = {
  query: string       // 検索クエリ（display_name or id）
  limit?: number      // 取得件数（デフォルト: 20）
}

// 出力
type SearchUsersResult = {
  success: true
  message: string
  data: {
    users: Array<{
      id: string
      display_name: string
      avatar_url: string | null
      is_friend: boolean        // 既につながりがあるか
      has_pending_request: boolean  // pendingリクエストがあるか
    }>
  }
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'FETCH_ERROR'
}
```

### 2.2 つながりリクエスト送信

**ファイル**: `app/actions/connections/send-request.ts`

```typescript
/**
 * つながりリクエスト送信
 * @spec FR-002: つながりリクエストの送信機能
 * @spec US1-2: リクエスト送信後、相手に通知が届く
 */
export async function sendConnectionRequest(
  receiverId: string,
  message?: string
): Promise<SendRequestResult>

// 入力
type SendRequestInput = {
  receiverId: string   // リクエスト送信先ユーザーID
  message?: string     // 任意メッセージ（最大200文字）
}

// 出力
type SendRequestResult = {
  success: true
  message: string
  code: 'REQUEST_SENT' | 'CONNECTION_ESTABLISHED'  // 同時リクエスト時は即成立
  data: {
    request_id?: string    // リクエストID（成立時はなし）
    connection_id?: string // つながりID（成立時のみ）
  }
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'SELF_REQUEST_NOT_ALLOWED' | 'REQUEST_ALREADY_PENDING' | 'ALREADY_CONNECTED' | 'USER_NOT_FOUND' | 'VALIDATION_ERROR'
}
```

### 2.3 つながりリクエスト一覧取得

**ファイル**: `app/actions/connections/get-requests.ts`

```typescript
/**
 * 受信したつながりリクエスト一覧取得
 * @spec US2-1: リクエスト一覧ページで送信者名とリクエスト日時を表示
 */
export async function getReceivedRequests(): Promise<GetRequestsResult>

// 出力
type GetRequestsResult = {
  success: true
  message: string
  data: {
    requests: Array<{
      id: string
      sender: {
        id: string
        display_name: string
        avatar_url: string | null
      }
      message: string | null
      created_at: string
      expires_at: string
    }>
  }
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'FETCH_ERROR'
}
```

### 2.4 つながりリクエスト承認

**ファイル**: `app/actions/connections/accept-request.ts`

```typescript
/**
 * つながりリクエスト承認
 * @spec FR-003: つながりリクエストの承認機能
 * @spec FR-015: 承認時、送信者に通知
 * @spec US2-2: 承認後、つながりが成立しリクエスト一覧から消える
 */
export async function acceptConnectionRequest(
  requestId: string
): Promise<AcceptRequestResult>

// 入力
type AcceptRequestInput = {
  requestId: string   // リクエストID
}

// 出力
type AcceptRequestResult = {
  success: true
  message: string
  code: 'CONNECTION_ESTABLISHED'
  data: {
    connection: {
      user_id: string
      target_id: string
    }
  }
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'REQUEST_NOT_FOUND' | 'REQUEST_EXPIRED' | 'ALREADY_CONNECTED'
}
```

### 2.5 つながりリクエスト拒否

**ファイル**: `app/actions/connections/reject-request.ts`

```typescript
/**
 * つながりリクエスト拒否
 * @spec FR-003: つながりリクエストの拒否機能
 * @spec FR-012: 拒否時、送信者への通知は行わない
 * @spec US2-3: 拒否後、リクエストが削除される
 */
export async function rejectConnectionRequest(
  requestId: string
): Promise<RejectRequestResult>

// 入力
type RejectRequestInput = {
  requestId: string   // リクエストID
}

// 出力
type RejectRequestResult = {
  success: true
  message: string
  code: 'REQUEST_REJECTED'
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'REQUEST_NOT_FOUND'
}
```

### 2.6 つながりリスト取得

**ファイル**: `app/actions/connections/get-connections.ts`

```typescript
/**
 * つながりリスト取得
 * @spec FR-005: つながりリストの一覧表示機能
 * @spec FR-010: カテゴリ別のフィルタ機能
 * @spec FR-011: 名前による検索機能
 */
export async function getConnections(
  options?: GetConnectionsOptions
): Promise<GetConnectionsResult>

// 入力
type GetConnectionsOptions = {
  category?: string    // カテゴリフィルタ（例: 'drinking'）
  search?: string      // 名前検索
  limit?: number       // 取得件数（デフォルト: 50）
  offset?: number      // オフセット
}

// 出力
type GetConnectionsResult = {
  success: true
  message: string
  data: {
    connections: Array<{
      target: {
        id: string
        display_name: string
        avatar_url: string | null
      }
      category_flags: Record<string, boolean>
      created_at: string
    }>
    total: number
  }
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'FETCH_ERROR'
}
```

### 2.7 カテゴリ設定更新

**ファイル**: `app/actions/connections/update-categories.ts`

```typescript
/**
 * つながりのカテゴリ設定更新
 * @spec FR-006: つながりごとのカテゴリ設定機能
 * @spec FR-007: カテゴリ設定は双方向で管理
 * @spec US3-1: 自分が設定したカテゴリのみ表示
 * @spec US3-2: 設定が保存され、次回表示時も反映
 */
export async function updateConnectionCategories(
  targetId: string,
  categoryFlags: Record<string, boolean>
): Promise<UpdateCategoriesResult>

// 入力
type UpdateCategoriesInput = {
  targetId: string                      // つながり相手のID
  categoryFlags: Record<string, boolean> // カテゴリ別フラグ
}

// 出力
type UpdateCategoriesResult = {
  success: true
  message: string
  code: 'CATEGORIES_UPDATED'
  data: {
    category_flags: Record<string, boolean>
  }
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'CONNECTION_NOT_FOUND' | 'CATEGORY_NOT_ENABLED' | 'VALIDATION_ERROR'
}
```

### 2.8 つながり削除

**ファイル**: `app/actions/connections/delete-connection.ts`

```typescript
/**
 * つながり削除
 * @spec FR-009: つながり削除機能
 * @spec US4-4: 削除ボタンを押して確認後、つながりが削除される
 */
export async function deleteConnection(
  targetId: string
): Promise<DeleteConnectionResult>

// 入力
type DeleteConnectionInput = {
  targetId: string   // 削除対象のつながり相手ID
}

// 出力
type DeleteConnectionResult = {
  success: true
  message: string
  code: 'CONNECTION_DELETED'
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'CONNECTION_NOT_FOUND'
}
```

### 2.9 通知一覧取得

**ファイル**: `app/actions/notifications/get-notifications.ts`

```typescript
/**
 * 通知一覧取得
 */
export async function getNotifications(
  options?: GetNotificationsOptions
): Promise<GetNotificationsResult>

// 入力
type GetNotificationsOptions = {
  unread_only?: boolean  // 未読のみ
  limit?: number         // 取得件数（デフォルト: 20）
  offset?: number        // オフセット
}

// 出力
type GetNotificationsResult = {
  success: true
  message: string
  data: {
    notifications: Array<{
      id: string
      type: 'connection_request' | 'connection_accepted'
      title: string
      body: string
      data: Record<string, unknown>
      is_read: boolean
      created_at: string
    }>
    unread_count: number
  }
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'FETCH_ERROR'
}
```

### 2.10 通知既読更新

**ファイル**: `app/actions/notifications/mark-as-read.ts`

```typescript
/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<MarkAsReadResult>

// 出力
type MarkAsReadResult = {
  success: true
  message: string
  code: 'NOTIFICATION_READ'
} | {
  success: false
  message: string
  code: 'UNAUTHORIZED' | 'NOTIFICATION_NOT_FOUND'
}
```

## 3. Zodスキーマ

**ファイル**: `lib/validation/connections.ts`

```typescript
import { z } from 'zod'

export const searchUsersSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).optional().default(20),
})

export const sendRequestSchema = z.object({
  receiverId: z.string().uuid(),
  message: z.string().max(200).optional(),
})

export const updateCategoriesSchema = z.object({
  targetId: z.string().uuid(),
  categoryFlags: z.record(z.string(), z.boolean()),
})
```

## 4. エラーコード一覧

| コード | HTTPステータス相当 | 説明 |
|--------|-------------------|------|
| UNAUTHORIZED | 401 | 認証エラー |
| VALIDATION_ERROR | 400 | 入力値バリデーションエラー |
| USER_NOT_FOUND | 404 | ユーザーが見つからない |
| CONNECTION_NOT_FOUND | 404 | つながりが見つからない |
| REQUEST_NOT_FOUND | 404 | リクエストが見つからない |
| NOTIFICATION_NOT_FOUND | 404 | 通知が見つからない |
| SELF_REQUEST_NOT_ALLOWED | 400 | 自分自身へのリクエスト |
| REQUEST_ALREADY_PENDING | 409 | 既にリクエスト送信済み |
| ALREADY_CONNECTED | 409 | 既につながりがある |
| REQUEST_EXPIRED | 410 | リクエスト期限切れ |
| CATEGORY_NOT_ENABLED | 400 | 無効なカテゴリ |
| FETCH_ERROR | 500 | データ取得エラー |
