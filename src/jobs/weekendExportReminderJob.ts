import type { Client } from "discord.js";
import { notifyWeekendExportReminder } from "../services/weekendExportReminderService.js";

export async function runWeekendExportReminderJob(client: Client): Promise<void> {
  await notifyWeekendExportReminder(client);
}
