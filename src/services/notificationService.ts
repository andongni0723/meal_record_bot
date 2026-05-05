import type { Client } from "discord.js";
import { MealStatus } from "@prisma/client";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { prisma } from "../db/prisma.js";
import { buildQuickRecordButtonId } from "../discord/handlers/quickRecord.js";
import { mealDisplayName, mealTypes } from "../utils/meal.js";
import { todayDateString } from "../utils/time.js";

export async function notifyPendingMeals(client: Client): Promise<void> {
  const settings = await prisma.userSetting.findMany();

  for (const setting of settings) {
    if (!setting.notifyChannelId) {
      continue;
    }

    const date = todayDateString(setting.timezone);
    const pendingTasks = await prisma.mealTask.findMany({
      where: {
        guildId: setting.guildId,
        userId: setting.userId,
        date,
        status: MealStatus.PENDING,
      },
    });

    if (pendingTasks.length === 0) {
      continue;
    }

    const channel = await client.channels.fetch(setting.notifyChannelId).catch(() => null);
    if (!channel || !("send" in channel) || typeof channel.send !== "function") {
      continue;
    }

    const tasksByType = new Map(pendingTasks.map((task) => [task.type, task]));
    for (const type of mealTypes) {
      const task = tasksByType.get(type);
      if (!task) {
        continue;
      }

      const recordButton = new ButtonBuilder()
        .setCustomId(
          buildQuickRecordButtonId({
            userId: task.userId,
            date: task.date,
            type: task.type,
          }),
        )
        .setLabel(`記錄${mealDisplayName[task.type]}`)
        .setStyle(ButtonStyle.Primary);

      await channel.send({
        content: `<@${task.userId}> 尚未記錄${mealDisplayName[task.type]}`,
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(recordButton)],
      });
    }
  }
}
