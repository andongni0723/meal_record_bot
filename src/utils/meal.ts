import { MealStatus, MealType } from "@prisma/client";

export const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER] as const;

export const mealTypeByCommandValue: Record<string, MealType> = {
  breakfast: MealType.BREAKFAST,
  lunch: MealType.LUNCH,
  dinner: MealType.DINNER,
};

export const mealCommandValueByType: Record<MealType, string> = {
  [MealType.BREAKFAST]: "breakfast",
  [MealType.LUNCH]: "lunch",
  [MealType.DINNER]: "dinner",
};

export const mealDisplayName: Record<MealType, string> = {
  [MealType.BREAKFAST]: "早餐",
  [MealType.LUNCH]: "午餐",
  [MealType.DINNER]: "晚餐",
};

export const statusDisplayName: Record<MealStatus, string> = {
  [MealStatus.PENDING]: "⚠️ 未記錄",
  [MealStatus.RECORDED]: "✅ 已記錄",
  [MealStatus.SKIPPED]: "⏭️ 已跳過",
};
