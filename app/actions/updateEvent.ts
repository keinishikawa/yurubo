/**
 * ファイル名: updateEvent.ts
 *
 * 【概要】
 * イベント更新のServer Action
 *
 * 【処理フロー】
 * 1. 認証チェック
 * 2. event.service.updateEvent呼び出し
 */

"use server";

import { updateEvent as updateEventService } from "@/lib/services/event.service";
import type { CreateEventInput } from "@/lib/validation/event.schema";
import type { ApiResponse } from "@/lib/services/event.service";

/**
 * イベント更新Server Action
 *
 * @param eventId - 更新対象イベントID
 * @param input - 更新データ
 * @returns API統一レスポンス
 */
export async function updateEvent(
  eventId: string,
  input: CreateEventInput
): Promise<ApiResponse<null>> {
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

  const result = await updateEventService(eventId, input, user.id);

  if (result.success) {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
  }

  return result;
}
