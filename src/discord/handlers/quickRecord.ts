import { MealType } from "@prisma/client";
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import { DateTime } from "luxon";
import { recordMeal } from "../../services/mealTaskService.js";
import { getOrCreateUserSetting } from "../../services/settingService.js";
import { mealDisplayName } from "../../utils/meal.js";

const QUICK_RECORD_BUTTON_PREFIX = "quick-record";
const QUICK_RECORD_MODAL_PREFIX = "quick-record-modal";
const TITLE_INPUT_ID = "title";

export function buildQuickRecordButtonId(input: {
  userId: string;
  date: string;
  type: MealType;
}): string {
  return [QUICK_RECORD_BUTTON_PREFIX, input.userId, input.date, input.type].join(":");
}

export function buildQuickRecordModalId(input: {
  userId: string;
  date: string;
  type: MealType;
}): string {
  return [QUICK_RECORD_MODAL_PREFIX, input.userId, input.date, input.type].join(":");
}

export function isQuickRecordButton(customId: string): boolean {
  return customId.startsWith(`${QUICK_RECORD_BUTTON_PREFIX}:`);
}

export function isQuickRecordModal(customId: string): boolean {
  return customId.startsWith(`${QUICK_RECORD_MODAL_PREFIX}:`);
}

export async function handleQuickRecordButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseQuickRecordCustomId(interaction.customId, QUICK_RECORD_BUTTON_PREFIX);

  if (!parsed || !interaction.guildId) {
    throw new Error("Invalid quick record button interaction.");
  }

  if (interaction.user.id !== parsed.userId) {
    await interaction.reply({
      content: "這個快速記錄按鈕不是給你的。",
      ephemeral: true,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(
      buildQuickRecordModalId({
        userId: parsed.userId,
        date: parsed.date,
        type: parsed.type,
      }),
    )
    .setTitle(`記錄${mealDisplayName[parsed.type]}`);

  const titleInput = new TextInputBuilder()
    .setCustomId(TITLE_INPUT_ID)
    .setLabel(`${mealDisplayName[parsed.type]}吃了什麼？`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput));

  await interaction.showModal(modal);
}

export async function handleQuickRecordModal(interaction: ModalSubmitInteraction): Promise<void> {
  const parsed = parseQuickRecordCustomId(interaction.customId, QUICK_RECORD_MODAL_PREFIX);

  if (!parsed || !interaction.guildId) {
    throw new Error("Invalid quick record modal interaction.");
  }

  if (interaction.user.id !== parsed.userId) {
    await interaction.reply({
      content: "這個快速記錄表單不是給你的。",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const title = interaction.fields.getTextInputValue(TITLE_INPUT_ID).trim();
  if (!title) {
    await interaction.editReply("餐點名稱不能空白。");
    return;
  }

  const setting = await getOrCreateUserSetting({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    notifyChannelId: interaction.channelId,
  });

  await recordMeal({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    date: parsed.date,
    type: parsed.type,
    title,
    recordedAt: DateTime.now().setZone(setting.timezone).toJSDate(),
  });

  await interaction.editReply(`✅ 已記錄${mealDisplayName[parsed.type]}：${title}`);
}

function parseQuickRecordCustomId(
  customId: string,
  expectedPrefix: typeof QUICK_RECORD_BUTTON_PREFIX | typeof QUICK_RECORD_MODAL_PREFIX,
): { userId: string; date: string; type: MealType } | null {
  const [prefix, userId, date, type] = customId.split(":");

  if (prefix !== expectedPrefix || !userId || !date || !isMealType(type)) {
    return null;
  }

  return {
    userId,
    date,
    type,
  };
}

function isMealType(value: string | undefined): value is MealType {
  return value === MealType.BREAKFAST || value === MealType.LUNCH || value === MealType.DINNER;
}
