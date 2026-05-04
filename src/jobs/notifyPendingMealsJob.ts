import type { Client } from "discord.js";
import { notifyPendingMeals } from "../services/notificationService.js";

export async function runNotifyPendingMealsJob(client: Client): Promise<void> {
  await notifyPendingMeals(client);
}
