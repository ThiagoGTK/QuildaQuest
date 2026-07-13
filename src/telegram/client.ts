import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { config } from "../config.js";

export async function createTelegramClient(): Promise<TelegramClient> {
  const client = new TelegramClient(
    new StringSession(config.telegramSession),
    config.telegramApiId,
    config.telegramApiHash,
    { connectionRetries: 3 }
  );
  await client.connect();
  return client;
}
