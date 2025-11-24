/**
 * ファイル名: EventEditModal.tsx
 *
 * 【概要】
 * イベント編集モーダルコンポーネント
 * 既存のイベント情報を編集するフォームを提供
 *
 * 【処理フロー】
 * 1. Propsで受け取ったイベント情報をフォーム初期値に設定
 * 2. 変更内容をバリデーション
 * 3. updateEventアクションを呼び出し
 *
 * 【依存関係】
 * - PostEventModalと類似のUI
 * - updateEvent Server Action
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type CreateEventInput } from "@/lib/validation/event.schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { EventCardData } from "./EventCard";

type EventEditModalProps = {
  event: EventCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventId: string, data: CreateEventInput) => Promise<void>;
  isLoading?: boolean;
};

const CATEGORY_OPTIONS = [
  { value: "drinking", label: "🍶 飲み", emoji: "🍶" },
  { value: "travel", label: "✈️ 旅行", emoji: "✈️" },
  { value: "tennis", label: "🎾 テニス", emoji: "🎾" },
  { value: "other", label: "📌 その他", emoji: "📌" },
] as const;

export function EventEditModal({
  event,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: EventEditModalProps) {
  // UTC文字列をJSTローカル文字列（YYYY-MM-DDTHH:MM）に変換
  const toJSTLocalISO = (utcStr: string) => {
    if (!utcStr) return "";
    try {
      const date = new Date(utcStr);
      // Intlを使ってJSTの日時部分を取得
      const jstParts = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(date);

      const part = (type: string) => jstParts.find((p) => p.type === type)?.value;
      return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
    } catch (e) {
      console.error("Date parse error:", e);
      return "";
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: event.title,
      category: event.category as CreateEventInput["category"],
      date_start: toJSTLocalISO(event.date_start),
      date_end: toJSTLocalISO(event.date_end),
      capacity_min: event.capacity_min,
      capacity_max: event.capacity_max,
      price_min: event.price_min ?? undefined,
      price_max: event.price_max ?? undefined,
      comment: event.comment ?? "",
      deadline: null,
    },
  });

  // フォーム値を監視
  const priceMin = watch("price_min");
  const priceMax = watch("price_max");
  const capacityMin = watch("capacity_min");
  const capacityMax = watch("capacity_max");
  const dateStart = watch("date_start");
  const dateEnd = watch("date_end");

  const onFormSubmit = async (data: CreateEventInput) => {
    // JSTとして解釈してUTCに変換
    const toISO = (dateStr: string) => {
      if (!dateStr) return dateStr;
      // 既にタイムゾーン情報が含まれている場合はそのまま
      if (dateStr.includes("+") || dateStr.endsWith("Z")) return dateStr;

      try {
        // JST (+09:00) として解釈してDateオブジェクトを作成
        const date = new Date(`${dateStr}:00+09:00`);
        return date.toISOString();
      } catch (e) {
        console.error("Date conversion error:", e);
        return dateStr;
      }
    };

    const submitData = {
      ...data,
      date_start: toISO(data.date_start),
      date_end: toISO(data.date_end),
    };

    await onSubmit(event.id, submitData);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>イベントを編集</DialogTitle>
          <DialogDescription>イベントの内容を変更します。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* カテゴリ選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              カテゴリ <span className="text-destructive">*</span>
            </label>
            <Select
              onValueChange={(value) =>
                setValue("category", value as "drinking" | "travel" | "tennis" | "other")
              }
              defaultValue={event.category}
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* タイトル */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              タイトル <span className="text-destructive">*</span>
            </label>
            <Input {...register("title")} placeholder="例: 軽く飲みませんか？" maxLength={50} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* 日時ピッカー */}
          <DateRangePicker
            value={{
              start: dateStart || "",
              end: dateEnd || "",
            }}
            onChange={(range) => {
              setValue("date_start", range.start);
              setValue("date_end", range.end);
            }}
            startError={errors.date_start?.message}
            endError={errors.date_end?.message}
            disabled={isLoading}
          />

          {/* 想定人数 */}
          <div className="space-y-2">
            <DualRangeSlider
              value={[capacityMin ?? 2, capacityMax ?? 6]}
              onValueChange={(values) => {
                setValue("capacity_min", values[0]);
                setValue("capacity_max", values[1]);
              }}
              min={1}
              max={20}
              step={1}
              label={(values) => `想定人数: ${values[0]}〜${values[1]}人`}
              disabled={isLoading}
            />
            {(errors.capacity_min || errors.capacity_max) && (
              <p className="text-sm text-destructive">
                {errors.capacity_min?.message || errors.capacity_max?.message}
              </p>
            )}
          </div>

          {/* 価格帯 */}
          <div className="space-y-2">
            <DualRangeSlider
              value={[priceMin ?? 3000, priceMax ?? 5000]}
              onValueChange={(values) => {
                setValue("price_min", values[0]);
                setValue("price_max", values[1]);
              }}
              min={0}
              max={20000}
              step={500}
              label={(values) =>
                `価格帯（任意）: ${values[0].toLocaleString()}〜${values[1].toLocaleString()}円`
              }
              disabled={isLoading}
            />
            {(errors.price_min || errors.price_max) && (
              <p className="text-sm text-destructive">
                {errors.price_min?.message || errors.price_max?.message}
              </p>
            )}
          </div>

          {/* コメント */}
          <div className="space-y-2">
            <label className="text-sm font-medium">コメント（任意）</label>
            <Textarea
              {...register("comment")}
              placeholder="例: 遅れて参加も歓迎です！"
              rows={4}
              maxLength={500}
            />
            {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
