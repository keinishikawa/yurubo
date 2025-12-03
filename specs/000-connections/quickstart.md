# Quickstart: つながり管理（Connections）

**Feature**: Epic 000 - つながり管理
**Date**: 2025-12-03

## 1. 前提条件

- Node.js 20.x 以上
- npm 10.x 以上
- Supabase CLI インストール済み
- ローカル Supabase 起動済み（`supabase start`）

## 2. セットアップ手順

### 2.1 依存関係の確認

```bash
# 必要なパッケージは既にインストール済み
npm install
```

### 2.2 マイグレーション実行

```bash
# 新規マイグレーションファイルを作成（実装時）
supabase migration new create_connection_requests_table
supabase migration new create_notifications_table

# マイグレーション適用
supabase db reset
```

### 2.3 型定義の再生成

```bash
# Supabase型定義を更新
supabase gen types typescript --local > lib/supabase/types.ts
```

## 3. 開発フロー

### 3.1 TDD サイクル

本プロジェクトはTDD（Test-Driven Development）を採用。

```bash
# 1. テストを先に書く（RED）
npm test -- --watch lib/services/connection.service.test.ts

# 2. テストが通る最小限の実装（GREEN）
# 3. リファクタリング
```

### 3.2 E2Eテスト

```bash
# Playwrightテスト実行
npm run test:e2e -- tests/e2e/connections/
```

### 3.3 push前チェック

```bash
# 全チェックを一括実行
npm run precheck
```

## 4. ディレクトリ構造

```
app/
├── actions/
│   ├── connections/           # 新規: つながり関連Server Actions
│   │   ├── search-users.ts
│   │   ├── send-request.ts
│   │   ├── get-requests.ts
│   │   ├── accept-request.ts
│   │   ├── reject-request.ts
│   │   ├── get-connections.ts
│   │   ├── update-categories.ts
│   │   └── delete-connection.ts
│   └── notifications/         # 新規: 通知関連Server Actions
│       ├── get-notifications.ts
│       └── mark-as-read.ts
├── (auth)/
│   └── connections/           # 新規: つながり管理ページ
│       ├── page.tsx           # つながりリスト
│       ├── requests/
│       │   └── page.tsx       # リクエスト一覧
│       └── search/
│           └── page.tsx       # ユーザー検索

components/
├── connections/               # 新規: つながり関連コンポーネント
│   ├── connection-list.tsx
│   ├── connection-card.tsx
│   ├── request-list.tsx
│   ├── request-card.tsx
│   ├── user-search.tsx
│   ├── category-editor.tsx
│   └── notification-badge.tsx

lib/
├── services/
│   └── connection.service.ts  # 既存: 拡張
├── validation/
│   └── connections.ts         # 新規: Zodスキーマ

supabase/
└── migrations/
    ├── 20251203000001_create_connection_requests_table.sql  # 新規
    └── 20251203000002_create_notifications_table.sql        # 新規

tests/
├── unit/
│   └── connections/           # 新規
└── e2e/
    └── connections/           # 新規
```

## 5. 主要な実装ポイント

### 5.1 ユーザー検索（US1）

```typescript
// app/actions/connections/search-users.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { searchUsersSchema } from '@/lib/validation/connections'

export async function searchUsers(query: string, options?: { limit?: number }) {
  const supabase = await createClient()

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: '認証が必要です', code: 'UNAUTHORIZED' }
  }

  // バリデーション
  const validated = searchUsersSchema.safeParse({ query, ...options })
  if (!validated.success) {
    return { success: false, message: '入力値が不正です', code: 'VALIDATION_ERROR' }
  }

  // ユーザー検索（自分を除外）
  const { data: users, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .neq('id', user.id)
    .or(`display_name.ilike.%${query}%,id.eq.${query}`)
    .limit(validated.data.limit)

  // 既存のつながり・リクエスト状態を取得
  // ...
}
```

### 5.2 同時リクエスト処理（Edge Case）

```typescript
// app/actions/connections/send-request.ts
export async function sendConnectionRequest(receiverId: string, message?: string) {
  // ...

  // 相手からのpendingリクエストをチェック
  const { data: existingRequest } = await supabase
    .from('connection_requests')
    .select('id')
    .eq('sender_id', receiverId)
    .eq('receiver_id', user.id)
    .single()

  if (existingRequest) {
    // 同時リクエスト検出 → 即座につながり成立
    await supabase.rpc('establish_connection_from_mutual_request', {
      p_user_a: user.id,
      p_user_b: receiverId,
      p_request_id: existingRequest.id
    })

    return {
      success: true,
      message: 'つながりが成立しました',
      code: 'CONNECTION_ESTABLISHED'
    }
  }

  // 通常のリクエスト送信処理
  // ...
}
```

### 5.3 カテゴリ設定画面（US3）

```tsx
// components/connections/category-editor.tsx
'use client'

import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

type CategoryEditorProps = {
  targetId: string
  currentFlags: Record<string, boolean>
  enabledCategories: string[]  // 自分が設定したカテゴリのみ
  onSave: (flags: Record<string, boolean>) => void
}

export function CategoryEditor({
  targetId,
  currentFlags,
  enabledCategories,
  onSave
}: CategoryEditorProps) {
  // enabledCategoriesに含まれるカテゴリのみ表示
  return (
    <div className="space-y-2">
      {enabledCategories.map((category) => (
        <div key={category} className="flex items-center gap-2">
          <Checkbox
            id={category}
            checked={currentFlags[category] ?? false}
            onCheckedChange={(checked) => {
              onSave({ ...currentFlags, [category]: !!checked })
            }}
          />
          <label htmlFor={category}>{getCategoryLabel(category)}</label>
        </div>
      ))}
    </div>
  )
}
```

## 6. テスト例

### 6.1 ユニットテスト

```typescript
// lib/services/connection.service.test.ts
describe('searchUsers', () => {
  it('既につながりのある相手にはis_friend=trueが返る', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.from('users').select.mockResolvedValue({
      data: [{ id: 'user-b', display_name: 'ユーザーB', avatar_url: null }],
      error: null
    })
    mockSupabase.from('connections').select.mockResolvedValue({
      data: [{ target_id: 'user-b' }],
      error: null
    })

    // Act
    const result = await searchUsers('ユーザーB')

    // Assert
    expect(result.success).toBe(true)
    expect(result.data.users[0].is_friend).toBe(true)
  })
})
```

### 6.2 E2Eテスト

```typescript
// tests/e2e/connections/us1-add-connection.spec.ts
import { test, expect } from '@playwright/test'

test.describe('US1: つながりの追加', () => {
  test('友人を検索してつながりリクエストを送信できる', async ({ page }) => {
    // Given: ログイン済みユーザー
    await loginAsTestUser(page)

    // When: 友人のユーザー名で検索
    await page.goto('/connections/search')
    await page.fill('[data-testid="user-search-input"]', 'テスト友人')
    await page.click('[data-testid="search-button"]')

    // Then: 該当するユーザーが表示される
    await expect(page.locator('[data-testid="user-result"]')).toContainText('テスト友人')

    // When: つながりリクエストを送信
    await page.click('[data-testid="send-request-button"]')

    // Then: 成功メッセージが表示される
    await expect(page.locator('[data-testid="toast"]')).toContainText('リクエストを送信しました')
  })

  test('既につながりのある相手には友人ラベルが表示される', async ({ page }) => {
    // Given: ユーザーBとつながりがある状態
    await setupConnection('user-a', 'user-b')
    await loginAsTestUser(page, 'user-a')

    // When: ユーザーBを検索
    await page.goto('/connections/search')
    await page.fill('[data-testid="user-search-input"]', 'ユーザーB')
    await page.click('[data-testid="search-button"]')

    // Then: 「友人」ラベルが表示され、リクエストボタンがない
    await expect(page.locator('[data-testid="friend-label"]')).toBeVisible()
    await expect(page.locator('[data-testid="send-request-button"]')).not.toBeVisible()
  })
})
```

## 7. 参考リンク

- [spec.md](./spec.md) - 機能仕様
- [data-model.md](./data-model.md) - データモデル
- [contracts/api.md](./contracts/api.md) - API契約
- [research.md](./research.md) - 技術調査結果
