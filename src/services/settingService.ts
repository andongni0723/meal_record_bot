import type { UserSetting } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { env } from "../env.js";

export const DEFAULT_ENABLED_DAYS = [1, 2, 3, 4, 5, 6, 7];
export const WEEKDAY_ENABLED_DAYS = [1, 2, 3, 4, 5];

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time must be HH:mm between 00:00 and 23:59");

export function validateHHmm(value: string): string {
  return timeSchema.parse(value);
}

export async function getOrCreateUserSetting(input: {
  guildId: string;
  userId: string;
  notifyChannelId?: string | null;
}): Promise<UserSetting> {
  return prisma.userSetting.upsert({
    where: {
      guildId_userId: {
        guildId: input.guildId,
        userId: input.userId,
      },
    },
    create: {
      guildId: input.guildId,
      userId: input.userId,
      notifyChannelId: input.notifyChannelId ?? null,
      timezone: env.DEFAULT_TIMEZONE,
      enabledDays: DEFAULT_ENABLED_DAYS,
      breakfastTime: "07:00",
      lunchTime: "13:00",
      dinnerTime: "20:00",
    },
    update: {},
  });
}

export async function updateNotifyChannel(input: {
  guildId: string;
  userId: string;
  channelId: string;
}): Promise<UserSetting> {
  await getOrCreateUserSetting(input);

  return prisma.userSetting.update({
    where: {
      guildId_userId: {
        guildId: input.guildId,
        userId: input.userId,
      },
    },
    data: {
      notifyChannelId: input.channelId,
    },
  });
}

export async function updateEnabledDays(input: {
  guildId: string;
  userId: string;
  mode: "everyday" | "weekdays";
}): Promise<UserSetting> {
  await getOrCreateUserSetting(input);

  return prisma.userSetting.update({
    where: {
      guildId_userId: {
        guildId: input.guildId,
        userId: input.userId,
      },
    },
    data: {
      enabledDays: input.mode === "everyday" ? DEFAULT_ENABLED_DAYS : WEEKDAY_ENABLED_DAYS,
    },
  });
}

export async function updateMealTime(input: {
  guildId: string;
  userId: string;
  type: "breakfast" | "lunch" | "dinner";
  time: string;
}): Promise<UserSetting> {
  const time = validateHHmm(input.time);
  await getOrCreateUserSetting(input);

  const fieldByType = {
    breakfast: "breakfastTime",
    lunch: "lunchTime",
    dinner: "dinnerTime",
  } as const;

  return prisma.userSetting.update({
    where: {
      guildId_userId: {
        guildId: input.guildId,
        userId: input.userId,
      },
    },
    data: {
      [fieldByType[input.type]]: time,
    },
  });
}

export function enabledDaysFromSetting(setting: UserSetting): number[] {
  if (Array.isArray(setting.enabledDays)) {
    return setting.enabledDays.filter((day): day is number => typeof day === "number");
  }

  return DEFAULT_ENABLED_DAYS;
}

export function isWeekdayEnabled(setting: UserSetting, isoWeekday: number): boolean {
  return enabledDaysFromSetting(setting).includes(isoWeekday);
}
