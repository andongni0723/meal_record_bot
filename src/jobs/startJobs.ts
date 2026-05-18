import type { Client } from "discord.js";
import cron from "node-cron";
import pino from "pino";
import { env } from "../env.js";
import { recoverTodayMealTasks } from "./recoverTodayMealTasks.js";
import { runMealTriggerJob } from "./mealTriggerJob.js";
import { runHourlyNotificationTasks } from "./hourlyNotificationTasks.js";
import { runNotifyPendingMealsJob } from "./notifyPendingMealsJob.js";
import { runWeekendExportReminderJob } from "./weekendExportReminderJob.js";

const logger = pino({ name: "jobs" });

export async function startJobs(client: Client): Promise<void> {
  await recoverTodayMealTasks();
  logger.info("Recovered today's meal tasks");

  cron.schedule(
    "* * * * *",
    async () => {
      try {
        await runMealTriggerJob();
      } catch (error) {
        logger.error({ error }, "Meal trigger job failed");
      }
    },
    {
      timezone: env.DEFAULT_TIMEZONE,
      noOverlap: true,
    },
  );

  cron.schedule(
    "0 * * * *",
    async () => {
      await runHourlyNotificationTasks(
        [
          {
            name: "pending meal notification",
            run: () => runNotifyPendingMealsJob(client),
          },
          {
            name: "weekend export reminder",
            run: () => runWeekendExportReminderJob(client),
          },
        ],
        (taskName, error) => {
          logger.error({ error, taskName }, "Hourly notification task failed");
        },
      );
    },
    {
      timezone: env.DEFAULT_TIMEZONE,
      noOverlap: true,
    },
  );

  logger.info("Scheduler jobs started");
}
