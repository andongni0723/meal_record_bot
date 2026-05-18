CREATE TABLE "WeekendExportReminder" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guildId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekendStartDate" TEXT NOT NULL,
  "stoppedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeekendExportReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeekendExportReminder_guildId_userId_weekendStartDate_key"
ON "WeekendExportReminder"("guildId", "userId", "weekendStartDate");
