/**
 * ファイル名: cancelEvent.ts
 *
 * 【概要】
 * イベント中止のServer Action
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. event.service.cancelEvent呼び出し
 */

"use server";

import { cancelEvent as cancelEventService } from "@/lib/services/event.service";
import type { ApiResponse } from "@/lib/services/event.service";

/**
 * イベント中止Server Action
 *
 * @param eventId - 対象イベントID
 * @returns API統一レスポンス
 */
export async function cancelEvent(eventId: string): Promise<ApiResponse<null>> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "ログインが必要です",
      code: "UNAUTHORIZED",
    };
  }

  const result = await cancelEventService(eventId, user.id);

  if (result.success) {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");
  }

  return result;
}
