import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { DateTime } from "luxon";
import { getOrCreateUserSetting } from "../../services/settingService.js";
import { recordMeal } from "../../services/mealTaskService.js";
import { mealDisplayName, mealTypeByCommandValue } from "../../utils/meal.js";
import { todayDateString } from "../../utils/time.js";

export const data = new SlashCommandBuilder()
  .setName("record")
  .setDescription("記錄今天的餐點")
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("餐別")
      .setRequired(true)
      .addChoices(
        { name: "早餐", value: "breakfast" },
        { name: "午餐", value: "lunch" },
        { name: "晚餐", value: "dinner" },
      ),
  )
  .addStringOption((option) => option.setName("title").setDescription("餐點名稱").setRequired(true));

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

  const typeValue = interaction.options.getString("type", true);
  const type = mealTypeByCommandValue[typeValue];
  const title = interaction.options.getString("title", true).trim();

  if (!type) {
    throw new Error("Unknown meal type.");
  }

  if (!title) {
    throw new Error("title is required.");
  }

  await recordMeal({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    date: todayDateString(setting.timezone),
    type,
    title,
    recordedAt: DateTime.now().setZone(setting.timezone).toJSDate(),
  });

  await interaction.editReply(`✅ 已記錄${mealDisplayName[type]}：${title}`);
}
