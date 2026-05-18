import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type Client } from "discord.js";
import { DateTime } from "luxon";
import { prisma } from "../db/prisma.js";
import {
  buildWeekendExportStopButtonId,
  getWeekendStartDateString,
  isWeekendDate,
  weekendExportStopButtonLabel,
} from "../utils/weekendExportReminder.js";
import { nowInTimezone } from "../utils/time.js";

export const weekendExportReminderContent = "記得匯出";

export async function notifyWeekendExportReminder(client: Client): Promise<void> {
  const settings = await prisma.userSetting.findMany();

  for (const setting of settings) {
    if (!setting.notifyChannelId) {
      continue;
    }

    const now = nowInTimezone(setting.timezone);
    if (!isWeekendDate(now)) {
      continue;
    }

    const weekendStartDate = getWeekendStartDateString(now);
    const stopped = await isWeekendExportReminderStopped({
      guildId: setting.guildId,
      userId: setting.userId,
      weekendStartDate,
    });
    if (stopped) {
      continue;
    }

    const channel = await client.channels.fetch(setting.notifyChannelId).catch(() => null);
    if (!channel || !("send" in channel) || typeof channel.send !== "function") {
      continue;
    }

    const stopButton = new ButtonBuilder()
      .setCustomId(
        buildWeekendExportStopButtonId({
          userId: setting.userId,
          weekendStartDate,
        }),
      )
      .setLabel(weekendExportStopButtonLabel)
      .setStyle(ButtonStyle.Secondary);

    await channel.send({
      content: weekendExportReminderContent,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(stopButton)],
    });
  }
}

export async function stopWeekendExportReminder(input: {
  guildId: string;
  userId: string;
  weekendStartDate: string;
  stoppedAt?: Date;
}): Promise<void> {
  const stoppedAt = input.stoppedAt ?? DateTime.now().toJSDate();

  await prisma.weekendExportReminder.upsert({
    where: {
      guildId_userId_weekendStartDate: {
        guildId: input.guildId,
        userId: input.userId,
        weekendStartDate: input.weekendStartDate,
      },
    },
    create: {
      guildId: input.guildId,
      userId: input.userId,
      weekendStartDate: input.weekendStartDate,
      stoppedAt,
    },
    update: {
      stoppedAt,
    },
  });
}

async function isWeekendExportReminderStopped(input: {
  guildId: string;
  userId: string;
  weekendStartDate: string;
}): Promise<boolean> {
  const reminder = await prisma.weekendExportReminder.findUnique({
    where: {
      guildId_userId_weekendStartDate: {
        guildId: input.guildId,
        userId: input.userId,
        weekendStartDate: input.weekendStartDate,
      },
    },
  });

  return reminder !== null;
}
