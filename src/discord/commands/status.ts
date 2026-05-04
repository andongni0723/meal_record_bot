import { MealType } from "@prisma/client";
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getDayOverride, getTodayTasks } from "../../services/mealTaskService.js";
import { getOrCreateUserSetting } from "../../services/settingService.js";
import { formatMealLine } from "../../utils/format.js";
import { todayDateString } from "../../utils/time.js";

export const data = new SlashCommandBuilder().setName("status").setDescription("查看今天的餐點狀態");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    throw new Error("This command can only be used in a guild.");
  }

  await interaction.deferReply({ ephemeral: true });

  const setting = await getOrCreateUserSetting({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    notifyChannelId: interaction.channelId,
  });
  const date = todayDateString(setting.timezone);
  const override = await getDayOverride({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    date,
  });

  if (override?.skipped) {
    await interaction.editReply(`今日狀態 ${date}\n\n⏭️ 今天已跳過記錄`);
    return;
  }

  const tasks = await getTodayTasks({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    date,
  });
  const taskByType = new Map(tasks.map((task) => [task.type, task]));

  await interaction.editReply(
    [
      `今日狀態 ${date}`,
      "",
      formatMealLine(MealType.BREAKFAST, taskByType.get(MealType.BREAKFAST)),
      formatMealLine(MealType.LUNCH, taskByType.get(MealType.LUNCH)),
      formatMealLine(MealType.DINNER, taskByType.get(MealType.DINNER)),
    ].join("\n"),
  );
}
