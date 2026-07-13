import { config } from "../config.js";

const API_BASE = `https://api.telegram.org/bot${config.telegramBotToken}`;

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number };
  text?: string;
  caption?: string;
  // Bot API atual usa forward_origin; forward_from é o campo legado (ainda enviado em alguns clientes).
  forward_origin?:
    | { type: "user"; sender_user: TelegramUser }
    | { type: "hidden_user"; sender_user_name: string }
    | { type: "chat" | "channel" };
  forward_from?: TelegramUser;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function callApi<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const body = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!body.ok) {
    throw new Error(`Telegram Bot API (${method}) falhou: ${body.description ?? res.statusText}`);
  }
  return body.result;
}

export async function getUpdates(offset: number): Promise<TelegramUpdate[]> {
  return callApi<TelegramUpdate[]>("getUpdates", {
    offset,
    timeout: 0,
    allowed_updates: ["message"],
  });
}

export async function sendMessage(chatId: bigint | number, text: string): Promise<void> {
  await callApi("sendMessage", { chat_id: chatId.toString(), text });
}
