// @ts-nocheck
/**
 * ファイル名: event.service.test.ts
 *
 * 【概要】
 * イベントサービスの単体テスト
 * TDDアプローチに基づき、実装前にテストを作成
 *
 * 【テスト対象】
 * - イベント作成のバリデーション
 * - 1日3件投稿上限チェック
 * - 匿名ID自動割り当て
 *
 * 【依存関係】
 * - Jest: テストフレームワーク
 * - event.service.ts: テスト対象のサービス（これから実装）
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// モック関数の型定義
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockGte = jest.fn();
const mockLt = jest.fn();

// チェーンメソッドのモック設定はbeforeEachで行う

/**
 * テストデータ: 有効なイベント作成データ
 */
const validEventData = {
  title: "週末飲み会",
  category: "drinking" as const,
  date_start: "2025-12-01T19:00", // ISO string (HTML5 datetime-local format)
  date_end: "2025-12-01T22:00", // ISO string
  capacity_min: 3,
  capacity_max: 5,
  price_min: 3000,
  price_max: 5000,
  comment: "仕事終わりに軽く一杯どうですか？",
};

describe("EventService", () => {
  let updateEvent: any;
  let cancelEvent: any;
  let createEvent: any;
  let createClient: any;

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();

    // モックとサービスをrequire
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    createClient = require("@/lib/supabase/server").createClient;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const service = require("./event.service");
    updateEvent = service.updateEvent;
    cancelEvent = service.cancelEvent;
    createEvent = service.createEvent;

    // チェーンメソッドのモック設定 (Reset after clearAllMocks/resetModules just in case)
    const mockBuilder: any = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
      gte: mockGte,
      lt: mockLt,
      then: jest.fn((resolve: any) => resolve({ count: 0, data: [], error: null })),
    };

    mockFrom.mockReturnValue(mockBuilder);
    mockSelect.mockReturnValue(mockBuilder);
    mockInsert.mockReturnValue(mockBuilder);
    mockUpdate.mockReturnValue(mockBuilder);
    mockEq.mockReturnValue(mockBuilder);
    mockGte.mockReturnValue(mockBuilder);
    mockLt.mockReturnValue(mockBuilder);

    // singleはPromiseを返す関数として定義
    mockSingle.mockResolvedValue({ data: { id: "event-123" }, error: null });

    // createClientのモック戻り値を設定
    createClient.mockReturnValue({
      from: mockFrom,
    });

    // デフォルトで成功レスポンスを返すように設定
    (mockSingle as unknown as jest.Mock).mockResolvedValue({
      data: { id: "event-123" },
      error: null,
    });
  });

  describe("T039: イベント作成バリデーション", () => {
    it("有効なデータでイベントを作成できる", async () => {
      // 1日3件制限チェックのモック (count: 0)
      (mockSingle as any).mockResolvedValueOnce({ count: 0, error: null });
      // 匿名ID割り当てのモック (count: 0)
      (mockSingle as any).mockResolvedValueOnce({ count: 0, error: null });
      // インサート成功のモック
      (mockSingle as any).mockResolvedValueOnce({
        data: { id: "new-event-id", anon_id: "🍶A" },
        error: null,
      });

      const result = await createEvent(validEventData, "user-id-123");
      expect(result.success).toBe(true);
    });

    it("必須項目が欠けている場合はエラーを返す", async () => {
      const invalidData = { ...validEventData, category: undefined };
      const result = await createEvent(invalidData as any, "user-id-123");
      expect(result.success).toBe(false);
      expect(result.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("T040: 1日3件投稿上限", () => {
    it("1日3件以上投稿しようとするとエラーになる", async () => {
      // 1日3件制限チェックのモック (count: 3)
      // mockBuilder.thenのデフォルト実装を上書きしてcount: 3を返す
      const mockBuilderWithCount3 = {
        ...createClient().from(), // 既存のメソッドをコピー
        then: jest.fn((resolve: any) => resolve({ count: 3, error: null })),
      };

      // チェーンの最後でこのビルダーが返されるように設定する必要があるが、
      // 簡略化のため、mockLtがこれを返すようにする（checkDailyPostLimitはltで終わる）
      mockLt.mockReturnValue(mockBuilderWithCount3);

      const result = await createEvent(validEventData, "user-id-123");

      expect(result.success).toBe(false);
      expect(result.code).toBe("DAILY_LIMIT_EXCEEDED");
    });
  });

  describe("T041: 匿名ID割り当て", () => {
    it("匿名IDが正しく割り当てられる（A, B, C...）", async () => {
      // 1. 制限チェックOK (count: 0)
      // 2. 匿名IDチェック (count: 1) -> 次はBになるはず

      // mockLtは制限チェックと匿名IDチェックの両方で使われるため、mockImplementationで呼び出しごとに変える
      let callCount = 0;
      mockLt.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // 1回目: 制限チェック (count: 0)
          return {
            then: (resolve: any) => resolve({ count: 0, error: null }),
            ...createClient().from(),
          };
        } else {
          // 2回目: 匿名IDチェック (count: 1) -> 既存イベントが1つあるので次はB
          return {
            then: (resolve: any) => resolve({ count: 1, error: null }),
            ...createClient().from(),
          };
        }
      });

      // インサート成功のモック
      (mockSingle as any).mockResolvedValueOnce({
        data: { id: "new-event-id", anon_id: "🍶B" },
        error: null,
      });

      const result = await createEvent(validEventData, "user-id-123");

      expect(result.success).toBe(true);
      expect(result.data?.anon_id).toBe("🍶B"); // カテゴリがdrinkingなので🍶 + B
    });
  });

  describe("User Story 3: イベント編集・中止", () => {
    describe("updateEvent", () => {
      it("幹事はイベントを更新できる", async () => {
        // 1. イベント取得（権限チェック用）
        (mockSingle as any).mockResolvedValueOnce({
          data: { host_id: "host-user-id", status: "recruiting" },
          error: null,
        });

        // 2. 更新実行
        (mockSingle as any).mockResolvedValueOnce({
          data: { id: "event-123", ...validEventData },
          error: null,
        });

        const result = await updateEvent("event-123", validEventData, "host-user-id");

        expect(result.success).toBe(true);
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.any(String),
          })
        );
      });

      it("幹事以外はイベントを更新できない", async () => {
        // 1. イベント取得（権限チェック用）
        (mockSingle as any).mockResolvedValueOnce({
          data: { host_id: "host-user-id", status: "recruiting" },
          error: null,
        });

        const result = await updateEvent("event-123", validEventData, "other-user-id");

        expect(result.success).toBe(false);
        expect(result.code).toBe("FORBIDDEN");
        expect(mockUpdate).not.toHaveBeenCalled();
      });

      it("中止されたイベントは更新できない", async () => {
        // 1. イベント取得（権限チェック用）
        (mockSingle as any).mockResolvedValueOnce({
          data: { host_id: "host-user-id", status: "cancelled" },
          error: null,
        });

        const result = await updateEvent("event-123", validEventData, "host-user-id");

        expect(result.success).toBe(false);
        expect(result.code).toBe("EVENT_CANCELLED");
        expect(mockUpdate).not.toHaveBeenCalled();
      });
    });

    describe("cancelEvent", () => {
      it("幹事はイベントを中止できる", async () => {
        // 1. イベント取得（権限チェック用）
        (mockSingle as any).mockResolvedValueOnce({
          data: { host_id: "host-user-id" },
          error: null,
        });

        // 2. 更新実行（ステータス変更）
        (mockSingle as any).mockResolvedValueOnce({
          data: { id: "event-123", status: "cancelled" },
          error: null,
        });

        const result = await cancelEvent("event-123", "host-user-id");

        expect(result.success).toBe(true);
        expect(mockUpdate).toHaveBeenCalledWith({ status: "cancelled" });
      });

      it("幹事以外はイベントを中止できない", async () => {
        // 1. イベント取得（権限チェック用）
        (mockSingle as any).mockResolvedValueOnce({
          data: { host_id: "host-user-id" },
          error: null,
        });

        const result = await cancelEvent("event-123", "other-user-id");

        expect(result.success).toBe(false);
        expect(result.code).toBe("FORBIDDEN");
        expect(mockUpdate).not.toHaveBeenCalled();
      });
    });
  });
});
