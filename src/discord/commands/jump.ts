import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getDayOverride, restoreExpectedTodayTasks, skipToday } from "../../services/mealTaskService.js";
import { getOrCreateUserSetting } from "../../services/settingService.js";
import { todayDateString } from "../../utils/time.js";

export const data = new SlashCommandBuilder().setName("jump").setDescription("切換今天是否跳過記錄");

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
    await restoreExpectedTodayTasks(setting);
    await interaction.editReply("✅ 已恢復今天的記錄提醒");
    return;
  }

  await skipToday({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    date,
  });
  await interaction.editReply("⏭️ 今天已跳過記錄");
}
