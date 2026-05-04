import pino from "pino";
import { client } from "./discord/client.js";
import { registerInteractionCreateHandler } from "./discord/handlers/interactionCreate.js";
import { env } from "./env.js";
import { startJobs } from "./jobs/startJobs.js";

const logger = pino({ name: "bot" });

registerInteractionCreateHandler(client);

client.once("ready", async () => {
  logger.info({ user: client.user?.tag }, "Discord bot is ready");
  await startJobs(client);
});

await client.login(env.DISCORD_TOKEN);
