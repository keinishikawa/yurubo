/**
 * ファイル名: server.ts
 *
 * 【概要】
 * Server Components用のSupabaseクライアント
 * Next.js 15 App RouterのServer Componentsから使用するクライアント
 *
 * 【処理フロー】
 * 1. Next.jsのcookies()を使用してクッキーストアを取得
 * 2. @supabase/ssr のcreateServerClient()でクライアント作成
 * 3. cookie.get/setでSupabase認証トークンを永続化
 *
 * 【主要機能】
 * - Server Components用Supabaseクライアント生成
 * - クッキーベースの認証状態管理
 * - 環境変数からSupabase URLとAnon Keyを読み込み
 *
 * 【依存関係】
 * - @supabase/ssr: Supabase SSRヘルパー
 * - next/headers: Next.jsクッキー操作
 * - 環境変数: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

/**
 * Server Components用Supabaseクライアント作成関数
 *
 * @returns Server Component用のSupabaseクライアントインスタンス
 *
 * 【処理内容】
 * 1. Next.jsのcookies()でクッキーストアを取得
 * 2. createServerClient()でSupabaseクライアント作成
 * 3. cookie.get()でクッキーから認証トークンを読み込み
 * 4. cookie.set()でクッキーに認証トークンを保存
 *
 * 【使用例】
 * // Server Componentから使用
 * const supabase = createClient()
 * const { data: events } = await supabase
 *   .from('events')
 *   .select('*')
 *   .eq('status', 'recruiting')
 *
 * 【注意】
 * - この関数はServer Componentsからのみ使用可能
 * - Client Componentsからは使用不可（client.tsを使用）
 * - クッキー操作はNext.jsのcookies()に依存
 */
export function createClient() {
  // Next.jsのクッキーストアを取得
  const cookieStore = cookies()

  // Server Components用Supabaseクライアント作成
  return createServerClient<Database>(
    // 環境変数からSupabase URLを取得
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // 環境変数からSupabase Anon Keyを取得
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * クッキーから値を取得
         *
         * @param name - クッキー名
         * @returns クッキーの値（存在しない場合は undefined）
         *
         * 【処理】
         * cookieStore.get()でクッキーを取得し、値を返す
         */
        getAll() {
          return cookieStore.getAll()
        },
        /**
         * クッキーに値を設定
         *
         * @param name - クッキー名
         * @param value - クッキーの値
         * @param options - クッキーオプション（有効期限、パスなど）
         *
         * 【処理】
         * cookieStore.set()でクッキーを設定
         * Supabase認証トークンの永続化に使用
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // set()はServer Component内で呼ばれることがあるが、
            // その場合はエラーになる可能性がある
            // エラーは無視（Server ActionやRoute Handlerで設定される）
          }
        },
      },
    }
  )
}
