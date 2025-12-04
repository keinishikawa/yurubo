/**
 * ファイル名: route.ts
 *
 * 【概要】
 * Magic Linkコールバックルート
 * メール内のリンクをクリックした際に呼び出されるエンドポイント
 *
 * 【処理フロー】
 * 1. URLからcodeパラメータを取得
 * 2. Supabase exchangeCodeForSessionでセッションを確立
 * 3. 新規ユーザーの場合はusersテーブルにレコード作成
 * 4. /（タイムライン）にリダイレクト
 *
 * 【依存関係】
 * - @supabase/ssr: Supabaseサーバークライアント
 * - next/headers: Cookie操作
 *
 * @see Issue #51 - Phase 0: 認証機能の修正（Magic Link認証への移行）
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /auth/callback
 *
 * Magic Linkのコールバックを処理する
 *
 * @param request - Next.jsリクエストオブジェクト
 * @returns リダイレクトレスポンス
 *
 * 【処理内容】
 * 1. URLからcodeパラメータを取得
 * 2. codeがある場合、Supabaseでセッションを確立
 * 3. 新規ユーザーの場合、usersテーブルにレコードを作成
 * 4. 成功時は/にリダイレクト
 * 5. 失敗時は/welcomeにリダイレクト
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // codeがない場合はエラー
  if (!code) {
    console.error('Magic Linkコールバック: codeパラメータがありません');
    return NextResponse.redirect(new URL('/welcome', requestUrl.origin));
  }

  // Cookie操作の準備
  const cookieStore = await cookies();

  // Supabaseクライアントを作成
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // codeをセッションに交換
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('セッション交換エラー:', error);
    return NextResponse.redirect(new URL('/welcome', requestUrl.origin));
  }

  // 新規ユーザーの場合、usersテーブルにレコードを作成
  if (data.user) {
    // usersテーブルに既存レコードがあるか確認
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    // 既存レコードがない場合は新規作成
    if (!existingUser) {
      const email = data.user.email || '';
      // メールアドレスの@より前の部分をデフォルト表示名として使用
      const defaultDisplayName = email.split('@')[0] || 'ユーザー';

      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        display_name: defaultDisplayName,
        enabled_categories: ['drinking', 'travel', 'tennis', 'other'],
        notification_preferences: {
          event_invitation: true,
          event_update: true,
          event_cancellation: true,
          participant_confirmed: true,
        },
      });

      if (insertError) {
        console.error('ユーザー作成エラー:', insertError);
        // ユーザー作成に失敗しても認証は成功しているのでリダイレクト
      }
    }
  }

  // 成功時は/（タイムライン）にリダイレクト
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
