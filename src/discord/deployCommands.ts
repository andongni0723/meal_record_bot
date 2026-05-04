import { REST, Routes } from "discord.js";
import pino from "pino";
import { env } from "../env.js";
import * as dashboardCommand from "./commands/dashboard.js";
import * as jumpCommand from "./commands/jump.js";
import * as recordCommand from "./commands/record.js";
import * as settingCommand from "./commands/setting.js";
import * as statusCommand from "./commands/status.js";

const logger = pino({ name: "deployCommands" });

const commands = [
  recordCommand.data,
  dashboardCommand.data,
  statusCommand.data,
  jumpCommand.data,
  settingCommand.data,
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
  body: commands,
});

logger.info({ count: commands.length }, "Guild slash commands deployed");
