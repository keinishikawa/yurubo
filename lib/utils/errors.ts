/**
 * ファイル名: errors.ts
 *
 * 【概要】
 * 統一されたエラーハンドリングユーティリティ
 * APIレスポンス形式の標準化とエラーコード管理
 *
 * 【処理フロー】
 * 1. エラーコードと日本語メッセージを定義
 * 2. success/error形式のレスポンスを生成
 * 3. Zodバリデーションエラーを整形
 *
 * 【主要機能】
 * - 成功レスポンス生成（successResponse）
 * - エラーレスポンス生成（errorResponse）
 * - Zodエラー整形（formatZodError）
 * - エラーコード定数管理（ERROR_CODES）
 *
 * 【依存関係】
 * - zod: Zodエラー型定義
 * - CLAUDE.md: 統一されたエラーレスポンス形式
 */

import { ZodError } from 'zod'

/**
 * APIレスポンスの基本型
 *
 * 【用途】すべてのAPI Routeで使用する統一形式
 * 【設計根拠】CLAUDE.md エラーハンドリングセクション
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  code: string
  data?: T
}

/**
 * エラーコード定数
 *
 * 【用途】エラー種別の識別子として使用
 * 【利点】
 * - フロントエンドで種類別のエラーハンドリングが可能
 * - ログ分析時にエラー種別を集計可能
 */
export const ERROR_CODES = {
  // バリデーションエラー
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // 認証エラー
  UNAUTHORIZED: 'UNAUTHORIZED',
  // 権限エラー
  FORBIDDEN: 'FORBIDDEN',
  // リソース未検出
  NOT_FOUND: 'NOT_FOUND',
  // データベースエラー
  DATABASE_ERROR: 'DATABASE_ERROR',
  // 外部APIエラー
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  // サーバー内部エラー
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  // リクエスト制限超過
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const

/**
 * 成功コード定数
 */
export const SUCCESS_CODES = {
  // 作成成功
  CREATED: 'CREATED',
  // 更新成功
  UPDATED: 'UPDATED',
  // 削除成功
  DELETED: 'DELETED',
  // 取得成功
  FETCHED: 'FETCHED',
  // 処理成功（汎用）
  SUCCESS: 'SUCCESS',
} as const

/**
 * 成功レスポンス生成関数
 *
 * @param message - 成功メッセージ（日本語）
 * @param code - 成功コード（SUCCESS_CODES）
 * @param data - レスポンスデータ（オプション）
 * @returns 成功レスポンスオブジェクト
 *
 * 【処理内容】
 * success: true, message, code, dataを含むオブジェクトを返す
 *
 * 【使用例】
 * // イベント作成成功
 * return Response.json(
 *   successResponse('イベントを作成しました', SUCCESS_CODES.CREATED, { eventId: '123' })
 * )
 *
 * // データ取得成功
 * return Response.json(
 *   successResponse('イベント一覧を取得しました', SUCCESS_CODES.FETCHED, { events })
 * )
 */
export function successResponse<T>(
  message: string,
  code: string = SUCCESS_CODES.SUCCESS,
  data?: T
): ApiResponse<T> {
  return {
    success: true,
    message,
    code,
    ...(data !== undefined && { data }),
  }
}

/**
 * エラーレスポンス生成関数
 *
 * @param message - エラーメッセージ（日本語）
 * @param code - エラーコード（ERROR_CODES）
 * @param data - エラー詳細データ（オプション）
 * @returns エラーレスポンスオブジェクト
 *
 * 【処理内容】
 * success: false, message, code, dataを含むオブジェクトを返す
 *
 * 【使用例】
 * // バリデーションエラー
 * return Response.json(
 *   errorResponse('タイトルを入力してください', ERROR_CODES.VALIDATION_ERROR),
 *   { status: 400 }
 * )
 *
 * // 認証エラー
 * return Response.json(
 *   errorResponse('ログインが必要です', ERROR_CODES.UNAUTHORIZED),
 *   { status: 401 }
 * )
 */
export function errorResponse<T = unknown>(
  message: string,
  code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
  data?: T
): ApiResponse<T> {
  return {
    success: false,
    message,
    code,
    ...(data !== undefined && { data }),
  }
}

/**
 * Zodバリデーションエラー整形関数
 *
 * @param error - ZodErrorオブジェクト
 * @returns エラーレスポンスオブジェクト
 *
 * 【処理内容】
 * 1. ZodErrorから最初のエラーメッセージを取得
 * 2. エラーレスポンス形式に変換
 * 3. 詳細なエラー情報（全issues）をdataに含める
 *
 * 【使用例】
 * const result = createEventSchema.safeParse(body)
 * if (!result.success) {
 *   return Response.json(
 *     formatZodError(result.error),
 *     { status: 400 }
 *   )
 * }
 *
 * 【レスポンス例】
 * {
 *   success: false,
 *   message: 'タイトルを入力してください',
 *   code: 'VALIDATION_ERROR',
 *   data: {
 *     issues: [
 *       { path: ['title'], message: 'タイトルを入力してください' }
 *     ]
 *   }
 * }
 */
export function formatZodError(error: ZodError): ApiResponse {
  // 最初のエラーメッセージを取得
  const firstIssue = error.issues[0]
  const message = firstIssue?.message ?? 'バリデーションエラーが発生しました'

  return errorResponse(message, ERROR_CODES.VALIDATION_ERROR, {
    issues: error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    })),
  })
}

/**
 * Supabaseエラー整形関数
 *
 * @param error - Supabaseエラーオブジェクト
 * @returns エラーレスポンスオブジェクト
 *
 * 【処理内容】
 * 1. Supabaseエラーコードを確認
 * 2. 適切な日本語エラーメッセージを生成
 * 3. エラーレスポンス形式に変換
 *
 * 【使用例】
 * const { data, error } = await supabase.from('events').insert(eventData)
 * if (error) {
 *   return Response.json(
 *     formatSupabaseError(error),
 *     { status: 500 }
 *   )
 * }
 *
 * 【主要なSupabaseエラーコード】
 * - 23505: UNIQUE制約違反
 * - 23503: FOREIGN KEY制約違反
 * - 42501: 権限エラー（RLS）
 */
export function formatSupabaseError(error: { code?: string; message?: string }): ApiResponse {
  // Supabaseエラーコードに応じてメッセージをカスタマイズ
  const errorCodeMessages: Record<string, string> = {
    '23505': '既に登録されています',
    '23503': '関連するデータが存在しません',
    '42501': 'この操作を実行する権限がありません',
    PGRST116: 'データが見つかりませんでした',
  }

  const message =
    (error.code && errorCodeMessages[error.code]) ??
    error.message ??
    'データベースエラーが発生しました'

  return errorResponse(message, ERROR_CODES.DATABASE_ERROR, {
    code: error.code,
    originalMessage: error.message,
  })
}

/**
 * 予期しないエラー整形関数
 *
 * @param error - Errorオブジェクト
 * @returns エラーレスポンスオブジェクト
 *
 * 【処理内容】
 * 1. Error.messageを取得
 * 2. 本番環境では詳細を隠す（セキュリティ対策）
 * 3. エラーレスポンス形式に変換
 *
 * 【使用例】
 * try {
 *   // 何らかの処理
 * } catch (error) {
 *   console.error('Unexpected error:', error)
 *   return Response.json(
 *     formatUnexpectedError(error),
 *     { status: 500 }
 *   )
 * }
 */
export function formatUnexpectedError(error: unknown): ApiResponse {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // 開発環境では詳細なエラーメッセージを表示
  if (isDevelopment && error instanceof Error) {
    return errorResponse(error.message, ERROR_CODES.INTERNAL_SERVER_ERROR, {
      stack: error.stack,
    })
  }

  // 本番環境では一般的なエラーメッセージのみ
  return errorResponse('サーバーエラーが発生しました', ERROR_CODES.INTERNAL_SERVER_ERROR)
}
