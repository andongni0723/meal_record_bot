import { MealStatus, MealType, type MealTask, type UserSetting } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { currentHHmm, currentIsoWeekday, isHHmmAfterOrEqual, todayDateString } from "../utils/time.js";
import { isWeekdayEnabled } from "./settingService.js";

export function mealTimeForType(setting: UserSetting, type: MealType): string {
  switch (type) {
    case MealType.BREAKFAST:
      return setting.breakfastTime;
    case MealType.LUNCH:
      return setting.lunchTime;
    case MealType.DINNER:
      return setting.dinnerTime;
  }
}

export async function recordMeal(input: {
  guildId: string;
  userId: string;
  date: string;
  type: MealType;
  title: string;
  recordedAt: Date;
}): Promise<MealTask> {
  return prisma.mealTask.upsert({
    where: {
      guildId_userId_date_type: {
        guildId: input.guildId,
        userId: input.userId,
        date: input.date,
        type: input.type,
      },
    },
    create: {
      guildId: input.guildId,
      userId: input.userId,
      date: input.date,
      type: input.type,
      status: MealStatus.RECORDED,
      title: input.title,
      recordedAt: input.recordedAt,
    },
    update: {
      status: MealStatus.RECORDED,
      title: input.title,
      recordedAt: input.recordedAt,
    },
  });
}

export async function ensurePendingMealTask(input: {
  guildId: string;
  userId: string;
  date: string;
  type: MealType;
}): Promise<MealTask> {
  return prisma.mealTask.upsert({
    where: {
      guildId_userId_date_type: {
        guildId: input.guildId,
        userId: input.userId,
        date: input.date,
        type: input.type,
      },
    },
    create: {
      guildId: input.guildId,
      userId: input.userId,
      date: input.date,
      type: input.type,
      status: MealStatus.PENDING,
    },
    update: {},
  });
}

export async function getTodayTasks(input: {
  guildId: string;
  userId: string;
  date: string;
}): Promise<MealTask[]> {
  return prisma.mealTask.findMany({
    where: {
      guildId: input.guildId,
      userId: input.userId,
      date: input.date,
    },
  });
}

export async function skipToday(input: {
  guildId: string;
  userId: string;
  date: string;
}): Promise<void> {
  await prisma.$transaction([
    prisma.dayOverride.upsert({
      where: {
        guildId_userId_date: {
          guildId: input.guildId,
          userId: input.userId,
          date: input.date,
        },
      },
      create: {
        guildId: input.guildId,
        userId: input.userId,
        date: input.date,
        skipped: true,
      },
      update: {
        skipped: true,
      },
    }),
    prisma.mealTask.updateMany({
      where: {
        guildId: input.guildId,
        userId: input.userId,
        date: input.date,
        status: MealStatus.PENDING,
      },
      data: {
        status: MealStatus.SKIPPED,
      },
    }),
  ]);
}

export async function restoreExpectedTodayTasks(setting: UserSetting): Promise<void> {
  const timezone = setting.timezone;
  const date = todayDateString(timezone);
  const isoWeekday = currentIsoWeekday(timezone);

  await prisma.dayOverride.upsert({
    where: {
      guildId_userId_date: {
        guildId: setting.guildId,
        userId: setting.userId,
        date,
      },
    },
    create: {
      guildId: setting.guildId,
      userId: setting.userId,
      date,
      skipped: false,
    },
    update: {
      skipped: false,
    },
  });

  if (!isWeekdayEnabled(setting, isoWeekday)) {
    return;
  }

  const hhmm = currentHHmm(timezone);
  const expectedTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER].filter((type) =>
    isHHmmAfterOrEqual(hhmm, mealTimeForType(setting, type)),
  );

  for (const type of expectedTypes) {
    const existing = await prisma.mealTask.findUnique({
      where: {
        guildId_userId_date_type: {
          guildId: setting.guildId,
          userId: setting.userId,
          date,
          type,
        },
      },
    });

    if (!existing) {
      await ensurePendingMealTask({
        guildId: setting.guildId,
        userId: setting.userId,
        date,
        type,
      });
      continue;
    }

    if (existing.status === MealStatus.SKIPPED) {
      await prisma.mealTask.update({
        where: {
          id: existing.id,
        },
        data: {
          status: MealStatus.PENDING,
        },
      });
    }
  }
}

export async function getDayOverride(input: {
  guildId: string;
  userId: string;
  date: string;
}) {
  return prisma.dayOverride.findUnique({
    where: {
      guildId_userId_date: {
        guildId: input.guildId,
        userId: input.userId,
        date: input.date,
      },
    },
  });
}
