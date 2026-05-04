import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { buildWeeklyDashboard } from "../../services/dashboardService.js";
import { getOrCreateUserSetting } from "../../services/settingService.js";

export const data = new SlashCommandBuilder().setName("dashboard").setDescription("查看本週飲食狀況");

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

  await interaction.editReply(await buildWeeklyDashboard(setting));
}
