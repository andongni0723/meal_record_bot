# Discord Meal Tracker Bot

用 Discord slash commands 記錄每日早餐、午餐、晚餐，並用 PostgreSQL/Prisma 保存所有狀態。排程使用 `node-cron`，所有日期邏輯以 `Asia/Taipei` 本地日期為準。

## Setup

需要：

- Node.js 22.12+
- pnpm
- PostgreSQL，預設建議使用 Supabase Postgres
- Discord Bot Token、Client ID、Guild ID

安裝依賴：

```bash
pnpm install
pnpm prisma:generate
```

## Environment

建立 `.env`：

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
DATABASE_URL=
DEFAULT_TIMEZONE=Asia/Taipei
```

## Database Migration

本機開發：

```bash
pnpm prisma:migrate:dev
```

Production / Railway：

```bash
pnpm prisma:migrate:deploy
```

Docker 啟動時會自動執行 `pnpm prisma:migrate:deploy`。

## Run Locally

先部署 slash commands：

```bash
pnpm deploy:commands
```

啟動 bot：

```bash
pnpm dev
```

## Commands

- `/record type: breakfast | lunch | dinner title: string`
- `/dashboard`
- `/status`
- `/jump`
- `/setting view`
- `/setting channel channel: Discord channel`
- `/setting days mode: everyday | weekdays | custom`
- `/setting time type: breakfast | lunch | dinner time: HH:mm`

`custom` 日期模式在 v1 先保留 TODO，已支援 `everyday` 與 `weekdays`。

## Railway Deployment

1. 建立 Railway project。
2. 加入 PostgreSQL 或填入 Supabase `DATABASE_URL`。
3. 設定環境變數：
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID`
   - `DATABASE_URL`
   - `DEFAULT_TIMEZONE=Asia/Taipei`
4. 使用 Dockerfile 部署。
5. 部署後在本機或 Railway one-off command 執行：

```bash
pnpm deploy:commands
```

## Production Notes

- Meal task 狀態存在 `MealTask.status`，不使用記憶體 boolean。
- 重啟時會執行 `recoverTodayMealTasks()`，補回 bot 離線期間已經過觸發時間的餐別。
- 每分鐘 trigger job 使用 upsert 建立 pending task，不會覆蓋已記錄餐點。
- 每小時只提醒 `PENDING`，不提醒 `RECORDED` 或 `SKIPPED`。
- 提醒訊息會附快速記錄按鈕，按下後用表單輸入餐點名稱並直接記錄。
