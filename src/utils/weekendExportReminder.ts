import type { DateTime } from "luxon";

const WEEKEND_EXPORT_STOP_BUTTON_PREFIX = "weekend-export-stop";
const APP_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const weekendExportStopButtonLabel = "停止通知";

export function buildWeekendExportStopButtonId(input: {
  userId: string;
  weekendStartDate: string;
}): string {
  return [WEEKEND_EXPORT_STOP_BUTTON_PREFIX, input.userId, input.weekendStartDate].join(":");
}

export function isWeekendExportStopButton(customId: string): boolean {
  return customId.startsWith(`${WEEKEND_EXPORT_STOP_BUTTON_PREFIX}:`);
}

export function parseWeekendExportStopButtonId(
  customId: string,
): { userId: string; weekendStartDate: string } | null {
  const [prefix, userId, weekendStartDate] = customId.split(":");

  if (prefix !== WEEKEND_EXPORT_STOP_BUTTON_PREFIX || !userId || !APP_DATE_PATTERN.test(weekendStartDate ?? "")) {
    return null;
  }

  return {
    userId,
    weekendStartDate,
  };
}

export function isWeekendDate(date: DateTime): boolean {
  return date.weekday === 6 || date.weekday === 7;
}

export function getWeekendStartDateString(date: DateTime): string {
  if (!isWeekendDate(date)) {
    throw new Error("Date is not a weekend date.");
  }

  const saturday = date.weekday === 6 ? date : date.minus({ days: 1 });
  return saturday.toFormat("yyyy-MM-dd");
}
