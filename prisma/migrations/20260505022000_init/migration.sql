CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');
CREATE TYPE "MealStatus" AS ENUM ('PENDING', 'RECORDED', 'SKIPPED');

CREATE TABLE "UserSetting" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guildId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notifyChannelId" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
  "enabledDays" JSONB NOT NULL,
  "breakfastTime" TEXT NOT NULL DEFAULT '07:00',
  "lunchTime" TEXT NOT NULL DEFAULT '13:00',
  "dinnerTime" TEXT NOT NULL DEFAULT '20:00',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MealTask" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guildId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "type" "MealType" NOT NULL,
  "status" "MealStatus" NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "recordedAt" TIMESTAMP(3),
  CONSTRAINT "MealTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DayOverride" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guildId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "skipped" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DayOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSetting_guildId_userId_key" ON "UserSetting"("guildId", "userId");
CREATE UNIQUE INDEX "MealTask_guildId_userId_date_type_key" ON "MealTask"("guildId", "userId", "date", "type");
CREATE INDEX "MealTask_date_status_idx" ON "MealTask"("date", "status");
CREATE UNIQUE INDEX "DayOverride_guildId_userId_date_key" ON "DayOverride"("guildId", "userId", "date");
