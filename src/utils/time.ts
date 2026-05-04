import { DateTime } from "luxon";
import { env } from "../env.js";

export const APP_DATE_FORMAT = "yyyy-MM-dd";

export function nowInTimezone(timezone = env.DEFAULT_TIMEZONE): DateTime {
  return DateTime.now().setZone(timezone);
}

export function todayDateString(timezone = env.DEFAULT_TIMEZONE): string {
  return nowInTimezone(timezone).toFormat(APP_DATE_FORMAT);
}

export function currentHHmm(timezone = env.DEFAULT_TIMEZONE): string {
  return nowInTimezone(timezone).toFormat("HH:mm");
}

export function currentIsoWeekday(timezone = env.DEFAULT_TIMEZONE): number {
  return nowInTimezone(timezone).weekday;
}

export function parseHHmmToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function isHHmmAfterOrEqual(current: string, target: string): boolean {
  return parseHHmmToMinutes(current) >= parseHHmmToMinutes(target);
}

export function currentWeekDates(timezone = env.DEFAULT_TIMEZONE): DateTime[] {
  const today = nowInTimezone(timezone).startOf("day");
  const monday = today.minus({ days: today.weekday - 1 });

  return Array.from({ length: 7 }, (_, index) => monday.plus({ days: index }));
}

export function isFutureDate(date: DateTime, timezone = env.DEFAULT_TIMEZONE): boolean {
  return date.startOf("day") > nowInTimezone(timezone).startOf("day");
}
