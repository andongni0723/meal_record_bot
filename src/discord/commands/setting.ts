import { ChannelType, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { mealDisplayName } from "../../utils/meal.js";
import {
  enabledDaysFromSetting,
  getOrCreateUserSetting,
  updateEnabledDays,
  updateMealTime,
  updateNotifyChannel,
  validateHHmm,
} from "../../services/settingService.js";

export const data = new SlashCommandBuilder()
  .setName("setting")
  .setDescription("管理記錄提醒設定")
  .addSubcommand((subcommand) => subcommand.setName("view").setDescription("查看目前設定"))
  .addSubcommand((subcommand) =>
    subcommand
      .setName("channel")
      .setDescription("設定提醒頻道")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("提醒頻道")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("days")
      .setDescription("設定啟用日期")
      .addStringOption((option) =>
        option
          .setName("mode")
          .setDescription("日期模式")
          .setRequired(true)
          .addChoices(
            { name: "每天", value: "everyday" },
            { name: "平日", value: "weekdays" },
            { name: "自訂", value: "custom" },
          ),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("time")
      .setDescription("設定餐點觸發時間")
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
      .addStringOption((option) =>
        option.setName("time").setDescription("HH:mm，例如 07:00").setRequired(true),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    throw new Error("This command can only be used in a guild.");
  }

  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "view") {
    const setting = await getOrCreateUserSetting({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      notifyChannelId: interaction.channelId,
    });

    await interaction.editReply(formatSettingView(setting));
    return;
  }

  if (subcommand === "channel") {
    const channel = interaction.options.getChannel("channel", true);
    await updateNotifyChannel({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      channelId: channel.id,
    });
    await interaction.editReply(`✅ 提醒頻道已設定為 <#${channel.id}>`);
    return;
  }

  if (subcommand === "days") {
    const mode = interaction.options.getString("mode", true);
    if (mode === "custom") {
      await getOrCreateUserSetting({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        notifyChannelId: interaction.channelId,
      });
      await interaction.editReply("自訂日期模式尚未實作，請先使用 everyday 或 weekdays。");
      return;
    }

    await updateEnabledDays({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      mode: mode as "everyday" | "weekdays",
    });
    await interaction.editReply(mode === "everyday" ? "✅ 已設定為每天提醒" : "✅ 已設定為平日提醒");
    return;
  }

  if (subcommand === "time") {
    const type = interaction.options.getString("type", true) as "breakfast" | "lunch" | "dinner";
    const time = interaction.options.getString("time", true);

    try {
      validateHHmm(time);
    } catch (error) {
      if (error instanceof z.ZodError) {
        await interaction.editReply("時間格式錯誤，請使用 HH:mm，範圍為 00:00 到 23:59。");
        return;
      }

      throw error;
    }

    await updateMealTime({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      type,
      time,
    });
    await interaction.editReply(`✅ 已設定${mealDisplayName[type.toUpperCase() as keyof typeof mealDisplayName]}時間為 ${time}`);
  }
}

function formatSettingView(setting: Awaited<ReturnType<typeof getOrCreateUserSetting>>): string {
  const days = enabledDaysFromSetting(setting).join(", ");
  const channel = setting.notifyChannelId ? `<#${setting.notifyChannelId}>` : "未設定";

  return [
    "目前設定",
    "",
    `提醒頻道：${channel}`,
    `啟用日期：${days}`,
    `早餐時間：${setting.breakfastTime}`,
    `午餐時間：${setting.lunchTime}`,
    `晚餐時間：${setting.dinnerTime}`,
    `時區：${setting.timezone}`,
  ].join("\n");
}
