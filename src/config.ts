import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export const config = {
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  telegramGroupId: BigInt(required("TELEGRAM_GROUP_ID")),
  telegramOwnerChatId: BigInt(required("TELEGRAM_OWNER_CHAT_ID")),
  sourceBotUsername: (process.env.TELEGRAM_SOURCE_BOT_USERNAME ?? "Teletofus").replace(/^@/, ""),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
};
