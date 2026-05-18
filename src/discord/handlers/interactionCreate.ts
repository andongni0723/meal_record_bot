import { Events, type ChatInputCommandInteraction, type Client, type RepliableInteraction } from "discord.js";
import pino from "pino";
import * as dashboardCommand from "../commands/dashboard.js";
import * as jumpCommand from "../commands/jump.js";
import * as recordCommand from "../commands/record.js";
import * as settingCommand from "../commands/setting.js";
import * as statusCommand from "../commands/status.js";
import {
  handleQuickRecordButton,
  handleQuickRecordModal,
  isQuickRecordButton,
  isQuickRecordModal,
} from "./quickRecord.js";
import { handleWeekendExportStopButton, isWeekendExportStopButton } from "./weekendExportReminder.js";

const logger = pino({ name: "interactionCreate" });

const commands = new Map<string, { execute: (interaction: ChatInputCommandInteraction) => Promise<void> }>([
  [recordCommand.data.name, recordCommand],
  [dashboardCommand.data.name, dashboardCommand],
  [statusCommand.data.name, statusCommand],
  [jumpCommand.data.name, jumpCommand],
  [settingCommand.data.name, settingCommand],
]);

export function registerInteractionCreateHandler(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isButton() && isQuickRecordButton(interaction.customId)) {
        await handleQuickRecordButton(interaction);
        return;
      }

      if (interaction.isButton() && isWeekendExportStopButton(interaction.customId)) {
        await handleWeekendExportStopButton(interaction);
        return;
      }

      if (interaction.isModalSubmit() && isQuickRecordModal(interaction.customId)) {
        await handleQuickRecordModal(interaction);
        return;
      }

      if (!interaction.isChatInputCommand()) {
        return;
      }

      const command = commands.get(interaction.commandName);
      if (!command) {
        return;
      }

      await command.execute(interaction);
    } catch (error) {
      logger.error({ error }, "Interaction failed");

      if (interaction.isRepliable()) {
        await replyWithError(interaction);
      }
    }
  });
}

async function replyWithError(interaction: RepliableInteraction): Promise<void> {
  const message = "操作失敗，請稍後再試。";

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(message).catch(() => undefined);
    return;
  }

  await interaction.reply({ content: message, ephemeral: true }).catch(() => undefined);
}
