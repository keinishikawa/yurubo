/**
 * ファイル名: middleware.ts
 *
 * 【概要】
 * Next.js Middleware - 認証ルート保護（T160, T164）
 *
 * 【主要機能】
 * - T160: 認証状態チェック
 * - T164: リダイレクトロジック
 *   - 未認証ユーザー → /welcome（登録画面）にリダイレクト
 *   - 認証済みユーザー → /welcome アクセス時は/（タイムライン）にリダイレクト
 *
 * 【処理フロー】
 * 1. リクエストを受信
 * 2. Supabaseセッションをチェック
 * 3. 認証状態とリクエストパスに基づいてリダイレクト判定
 * 4. 必要に応じてリダイレクトまたはリクエストを続行
 *
 * 【依存関係】
 * - @supabase/ssr: SupabaseミドルウェアヘルパーCreate an account to continue
 * - Next.js Middleware
 *
 * @see specs/001-event-creation/spec.md - User Story 4 受入シナリオ3,4
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // セッションチェック（T160）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // リダイレクトロジック（T164）
  const isWelcomePage = request.nextUrl.pathname === '/welcome';
  const isAuthRequired = !isWelcomePage && !request.nextUrl.pathname.startsWith('/_next');

  // 未認証ユーザーが保護されたルートにアクセス → /welcome にリダイレクト
  if (!user && isAuthRequired) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/welcome';
    return NextResponse.redirect(redirectUrl);
  }

  // 認証済みユーザーが /welcome にアクセス → / にリダイレクト
  if (user && isWelcomePage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * すべてのリクエストパスにマッチ、ただし以下を除く:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - public フォルダ内のファイル
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
