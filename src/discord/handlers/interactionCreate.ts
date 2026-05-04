import { Events, type ChatInputCommandInteraction, type Client } from "discord.js";
import pino from "pino";
import * as dashboardCommand from "../commands/dashboard.js";
import * as jumpCommand from "../commands/jump.js";
import * as recordCommand from "../commands/record.js";
import * as settingCommand from "../commands/setting.js";
import * as statusCommand from "../commands/status.js";

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
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = commands.get(interaction.commandName);
    if (!command) {
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error({ error, commandName: interaction.commandName }, "Command failed");

      const message = "操作失敗，請稍後再試。";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => undefined);
      } else {
        await interaction.reply({ content: message, ephemeral: true }).catch(() => undefined);
      }
    }
  });
}
