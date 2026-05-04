import { MealType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { currentHHmm, currentIsoWeekday, isHHmmAfterOrEqual, todayDateString } from "../utils/time.js";
import { ensurePendingMealTask, mealTimeForType } from "../services/mealTaskService.js";
import { isWeekdayEnabled } from "../services/settingService.js";

export async function recoverTodayMealTasks(): Promise<void> {
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
    const expectedTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER].filter((type) =>
      isHHmmAfterOrEqual(hhmm, mealTimeForType(setting, type)),
    );

    for (const type of expectedTypes) {
      await ensurePendingMealTask({
        guildId: setting.guildId,
        userId: setting.userId,
        date,
        type,
      });
    }
  }
}
