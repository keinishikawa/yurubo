/**
 * ファイル名: client.ts
 *
 * 【概要】
 * Client Components用のSupabaseクライアント
 * Next.js 15 App RouterのClient Componentsから使用するクライアント
 *
 * 【処理フロー】
 * 1. @supabase/ssr のcreateBrowserClient()でクライアント作成
 * 2. ブラウザのlocalStorageを使用して認証トークンを永続化
 * 3. シングルトンパターンで同一インスタンスを再利用
 *
 * 【主要機能】
 * - Client Components用Supabaseクライアント生成
 * - ブラウザベースの認証状態管理
 * - 環境変数からSupabase URLとAnon Keyを読み込み
 *
 * 【依存関係】
 * - @supabase/ssr: Supabase SSRヘルパー
 * - 環境変数: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

/**
 * Client Components用Supabaseクライアント作成関数
 *
 * @returns Client Component用のSupabaseクライアントインスタンス
 *
 * 【処理内容】
 * 1. createBrowserClient()でSupabaseクライアント作成
 * 2. ブラウザのlocalStorageで認証トークンを自動管理
 * 3. Realtime subscriptionなどのクライアント機能を有効化
 *
 * 【使用例】
 * // Client Componentから使用（'use client'ディレクティブ必須）
 * 'use client'
 *
 * import { createClient } from '@/lib/supabase/client'
 *
 * export default function EventList() {
 *   const supabase = createClient()
 *
 *   useEffect(() => {
 *     // Realtime subscriptionの例
 *     const channel = supabase
 *       .channel('events')
 *       .on('postgres_changes', {
 *         event: 'INSERT',
 *         schema: 'public',
 *         table: 'events'
 *       }, (payload) => {
 *         console.log('New event:', payload.new)
 *       })
 *       .subscribe()
 *
 *     return () => {
 *       supabase.removeChannel(channel)
 *     }
 *   }, [])
 * }
 *
 * 【注意】
 * - この関数はClient Componentsからのみ使用可能
 * - Server Componentsからは使用不可（server.tsを使用）
 * - 環境変数はNEXT_PUBLIC_プレフィックスが必要（クライアント公開用）
 */
export function createClient() {
  // Client Components用Supabaseクライアント作成
  return createBrowserClient<Database>(
    // Next.jsがビルド時に置換する環境変数
    // Turbopackでは process.env.NEXT_PUBLIC_* は自動的に置換される
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
