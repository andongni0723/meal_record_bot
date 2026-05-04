import type { MealTask, UserSetting } from "@prisma/client";
import { MealType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { formatDashboardCell, formatDashboardDate } from "../utils/format.js";
import { currentWeekDates, isFutureDate } from "../utils/time.js";

export async function buildWeeklyDashboard(setting: UserSetting): Promise<string> {
  const timezone = setting.timezone;
  const weekDates = currentWeekDates(timezone);
  const dateStrings = weekDates.map((date) => date.toFormat("yyyy-MM-dd"));

  const tasks = await prisma.mealTask.findMany({
    where: {
      guildId: setting.guildId,
      userId: setting.userId,
      date: {
        in: dateStrings,
      },
    },
  });
  const skippedOverrides = await prisma.dayOverride.findMany({
    where: {
      guildId: setting.guildId,
      userId: setting.userId,
      date: {
        in: dateStrings,
      },
      skipped: true,
    },
  });

  const taskByDateAndType = new Map<string, MealTask>();
  for (const task of tasks) {
    taskByDateAndType.set(`${task.date}:${task.type}`, task);
  }
  const skippedDates = new Set(skippedOverrides.map((override) => override.date));

  const lines = ["本週飲食狀況", "", "日期          早餐        午餐        晚餐"];

  for (const date of weekDates) {
    const dateString = date.toFormat("yyyy-MM-dd");
    const cells = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER].map((type) => {
      if (isFutureDate(date, timezone)) {
        return "—";
      }

      const task = taskByDateAndType.get(`${dateString}:${type}`);
      if (task) {
        return formatDashboardCell(task);
      }

      if (skippedDates.has(dateString)) {
        return "⏭️ 已跳過";
      }

      return "—";
    });

    lines.push(`${formatDashboardDate(date).padEnd(12)} ${cells[0].padEnd(10)} ${cells[1].padEnd(10)} ${cells[2]}`);
  }

  return `\`\`\`\n${lines.join("\n")}\n\`\`\``;
}
