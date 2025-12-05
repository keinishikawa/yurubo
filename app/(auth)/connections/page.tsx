/**
 * ファイル名: page.tsx (Connections List)
 *
 * 【概要】
 * つながりリストページ - User Story 4
 *
 * 【主要機能】
 * - T037: つながりリストページ
 * - T038: カテゴリフィルタ機能
 * - T039: 名前検索機能
 * - T040: 削除確認ダイアログ
 *
 * 【処理フロー】
 * 1. つながりリストを取得
 * 2. カテゴリフィルタ・名前検索を適用
 * 3. つながりカードを一覧表示
 * 4. 削除ボタンで確認ダイアログを表示
 *
 * 【依存関係】
 * - ConnectionList: つながりリスト表示
 * - getConnections: Server Action
 * - deleteConnection: Server Action
 * - shadcn-ui: Input, Select, AlertDialog
 *
 * @spec FR-005: つながりリストの一覧表示機能
 * @spec FR-010: カテゴリ別のフィルタ機能
 * @spec FR-011: 名前による検索機能
 * @spec FR-009: つながり削除機能
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectionList, type ConnectionItem } from '@/components/connections/connection-list'
import { getConnections } from '@/app/actions/connections/get-connections'
import { deleteConnection } from '@/app/actions/connections/delete-connection'
import { CategoryEditor } from '@/components/connections/category-editor'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Search, Users, UserPlus, Bell } from 'lucide-react'
import Link from 'next/link'

/**
 * カテゴリ情報（マスタデータ）
 * 本来はAPIから取得するが、現時点では固定値
 */
const CATEGORIES = [
  { value: 'drinking', label: '飲み', emoji: '🍶' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'tennis', label: 'テニス', emoji: '🎾' },
  { value: 'other', label: 'その他', emoji: '📌' },
]

/**
 * つながりリストページコンポーネント
 */
export default function ConnectionsPage() {
  const router = useRouter()

  // 状態管理
  const [connections, setConnections] = useState<ConnectionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [enabledCategories, setEnabledCategories] = useState<string[]>([])

  // 削除確認ダイアログの状態
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteTargetName, setDeleteTargetName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)

  // カテゴリ編集ダイアログの状態
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editTargetName, setEditTargetName] = useState<string>('')
  const [editCurrentFlags, setEditCurrentFlags] = useState<Record<string, boolean>>({})

  // マウントフラグ（初回レンダリング判定用）
  const isMounted = useRef(false)

  // 初回読み込みとフィルタ変更時にデータ取得
  useEffect(() => {
    let isCancelled = false

    const fetchConnections = async () => {
      if (!isMounted.current) {
        isMounted.current = true
      }
      setIsLoading(true)

      const result = await getConnections({
        category: categoryFilter || undefined,
        search: debouncedSearch || undefined,
      })

      if (isCancelled) return

      if (result.success) {
        setConnections(result.data.connections)
        setTotalCount(result.data.total)
        setEnabledCategories(result.data.enabledCategories)
      } else {
        if (result.code === 'UNAUTHORIZED') {
          router.push('/welcome')
          return
        }
        toast.error(result.message)
      }

      setIsLoading(false)
    }

    fetchConnections()

    return () => {
      isCancelled = true
    }
  }, [categoryFilter, debouncedSearch, router])

  // 検索クエリのデバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  /**
   * 削除ボタンクリック時のハンドラ
   * 確認ダイアログを表示
   */
  const handleDeleteClick = (targetId: string) => {
    const target = connections.find((c) => c.target.id === targetId)
    if (target) {
      setDeleteTargetId(targetId)
      setDeleteTargetName(target.target.display_name)
    }
  }

  /**
   * 削除確認後のハンドラ
   */
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return

    setIsDeleting(true)

    const result = await deleteConnection(deleteTargetId)

    if (result.success) {
      toast.success(result.message)
      // リストから削除
      setConnections((prev) => prev.filter((c) => c.target.id !== deleteTargetId))
      setTotalCount((prev) => prev - 1)
    } else {
      toast.error(result.message)
    }

    setIsDeleting(false)
    setDeleteTargetId(null)
    setDeleteTargetName('')
  }

  /**
   * 削除キャンセル時のハンドラ
   */
  const handleCancelDelete = () => {
    setDeleteTargetId(null)
    setDeleteTargetName('')
  }

  /**
   * カテゴリ編集ボタンクリック時のハンドラ
   */
  const handleEditCategoriesClick = (targetId: string, targetName: string) => {
    const target = connections.find((c) => c.target.id === targetId)
    if (target) {
      setEditTargetId(targetId)
      setEditTargetName(targetName)
      setEditCurrentFlags(target.category_flags)
    }
  }

  /**
   * カテゴリ編集完了時のハンドラ
   */
  const handleCategoryEditorComplete = () => {
    // ダイアログを閉じる
    setEditTargetId(null)
    setEditTargetName('')
    setEditCurrentFlags({})

    // つながりリストを再読み込み
    const fetchConnections = async () => {
      const result = await getConnections({
        category: categoryFilter || undefined,
        search: debouncedSearch || undefined,
      })

      if (result.success) {
        setConnections(result.data.connections)
        setTotalCount(result.data.total)
        setEnabledCategories(result.data.enabledCategories)
      }
    }

    fetchConnections()
  }

  /**
   * カテゴリ編集キャンセル時のハンドラ
   */
  const handleCancelEditCategories = () => {
    setEditTargetId(null)
    setEditTargetName('')
    setEditCurrentFlags({})
  }

  /**
   * カテゴリフィルタ変更時のハンドラ
   */
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value === 'all' ? '' : value)
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">つながりリスト</h1>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              ({totalCount}人)
            </span>
          )}
        </div>
      </div>

      {/* サブナビゲーション */}
      <div className="flex gap-2 mb-6">
        <Link
          href="/connections/search"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
        >
          <UserPlus className="h-4 w-4" />
          友人を検索
        </Link>
        <Link
          href="/connections/requests"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent text-sm font-medium"
        >
          <Bell className="h-4 w-4" />
          リクエスト
        </Link>
      </div>

      {/* フィルタ・検索エリア */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* カテゴリフィルタ (T038) */}
        <Select
          value={categoryFilter || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="category-filter">
            <SelectValue placeholder="カテゴリで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.emoji} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 名前検索 (T039) */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="名前で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
      </div>

      {/* つながりリスト */}
      <ConnectionList
        connections={connections}
        availableCategories={CATEGORIES}
        onEditCategories={handleEditCategoriesClick}
        onDelete={handleDeleteClick}
        deletingTargetId={isDeleting ? deleteTargetId : null}
        isLoading={isLoading}
      />

      {/* 削除確認ダイアログ (T040) */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete()
        }}
      >
        <AlertDialogContent data-testid="delete-confirmation-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>つながりを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargetName}さんとのつながりを削除します。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDelete}
              disabled={isDeleting}
              data-testid="cancel-delete-button"
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-button"
            >
              {isDeleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* カテゴリ編集ダイアログ (T029) */}
      <Dialog
        open={editTargetId !== null}
        onOpenChange={(open) => {
          if (!open) handleCancelEditCategories()
        }}
      >
        <DialogContent data-testid="category-editor-dialog">
          <DialogHeader>
            <DialogTitle>{editTargetName}さんのカテゴリ設定</DialogTitle>
          </DialogHeader>
          {editTargetId && (
            <CategoryEditor
              targetId={editTargetId}
              targetName={editTargetName}
              currentFlags={editCurrentFlags}
              enabledCategories={enabledCategories}
              onComplete={handleCategoryEditorComplete}
              onCancel={handleCancelEditCategories}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
