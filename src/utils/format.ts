import type { MealTask } from "@prisma/client";
import { MealStatus, MealType } from "@prisma/client";
import type { DateTime } from "luxon";
import { mealDisplayName, statusDisplayName } from "./meal.js";

export function formatTaskStatus(task?: MealTask | null): string {
  if (!task) {
    return "— 尚未觸發";
  }

  if (task.status === MealStatus.RECORDED) {
    return task.title ? `✅ ${task.title}` : "✅ 已記錄";
  }

  return statusDisplayName[task.status];
}

export function formatDashboardCell(task?: MealTask | null): string {
  if (!task) {
    return "—";
  }

  if (task.status === MealStatus.RECORDED) {
    return task.title ? `✅ ${task.title}` : "✅ 已記錄";
  }

  if (task.status === MealStatus.PENDING) {
    return "⚠️ 未記錄";
  }

  return "⏭️ 已跳過";
}

export function formatMealLine(type: MealType, task?: MealTask | null): string {
  return `${mealDisplayName[type]}：${formatTaskStatus(task)}`;
}

export function formatDashboardDate(date: DateTime): string {
  return date.setLocale("en").toFormat("MM/dd ccc");
}
