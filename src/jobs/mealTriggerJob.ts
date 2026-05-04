import { MealType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { currentHHmm, currentIsoWeekday, todayDateString } from "../utils/time.js";
import { ensurePendingMealTask } from "../services/mealTaskService.js";
import { isWeekdayEnabled } from "../services/settingService.js";

export async function runMealTriggerJob(): Promise<void> {
  const settings = await prisma.userSetting.findMany();

  for (const setting of settings) {
    const timezone = setting.timezone;
    const date = todayDateString(timezone);

    if (!isWeekdayEnabled(setting, currentIsoWeekday(timezone))) {
      continue;
    }

    const override = await prisma.dayOverride.findUnique({
      where: {
        guildId_userId_date: {
          guildId: setting.guildId,
          userId: setting.userId,
          date,
        },
      },
    });

    if (override?.skipped) {
      continue;
    }

    const hhmm = currentHHmm(timezone);
    const dueTypes: MealType[] = [];

    if (hhmm === setting.breakfastTime) {
      dueTypes.push(MealType.BREAKFAST);
    }
    if (hhmm === setting.lunchTime) {
      dueTypes.push(MealType.LUNCH);
    }
    if (hhmm === setting.dinnerTime) {
      dueTypes.push(MealType.DINNER);
    }

    for (const type of dueTypes) {
      await ensurePendingMealTask({
        guildId: setting.guildId,
        userId: setting.userId,
        date,
        type,
      });
    }
  }
}
