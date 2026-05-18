import type { ButtonInteraction } from "discord.js";
import { stopWeekendExportReminder } from "../../services/weekendExportReminderService.js";
import { parseWeekendExportStopButtonId } from "../../utils/weekendExportReminder.js";

export {
  buildWeekendExportStopButtonId,
  getWeekendStartDateString,
  isWeekendDate,
  isWeekendExportStopButton,
  parseWeekendExportStopButtonId,
  weekendExportStopButtonLabel,
} from "../../utils/weekendExportReminder.js";

export async function handleWeekendExportStopButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseWeekendExportStopButtonId(interaction.customId);

  if (!parsed || !interaction.guildId) {
    throw new Error("Invalid weekend export stop button interaction.");
  }

  if (interaction.user.id !== parsed.userId) {
    await interaction.reply({
      content: "這個停止通知按鈕不是給你的。",
      ephemeral: true,
    });
    return;
  }

  await stopWeekendExportReminder({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    weekendStartDate: parsed.weekendStartDate,
  });

  await interaction.reply({
    content: "✅ 已停止本週末匯出提醒",
    ephemeral: true,
  });
}
