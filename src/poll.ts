import { Api } from "telegram";
import type { TelegramClient } from "telegram";
import { createTelegramClient } from "./telegram/client.js";
import { parseCombatCard } from "./telegram/parseCard.js";
import { getLastMessageId, insertKills, setLastMessageId, type KillRecord } from "./db/kills.js";
import { buildLeaderboardMessage } from "./leaderboard.js";
import { config } from "./config.js";

function displayName(sender: unknown): string {
  if (sender instanceof Api.User) {
    const name = [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim();
    return name || (sender.username ? `@${sender.username}` : `id:${sender.id}`);
  }
  return "Desconhecido";
}

async function resolveSourceBotId(client: TelegramClient): Promise<bigint | null> {
  try {
    const entity = await client.getEntity(config.sourceBotUsername);
    if (entity instanceof Api.User) {
      return BigInt(entity.id.toString());
    }
  } catch (err) {
    console.warn(`Não foi possível resolver o bot de origem (@${config.sourceBotUsername}):`, err);
  }
  return null;
}

function isForwardedFromSourceBot(message: Api.Message, sourceBotId: bigint | null): boolean {
  const fwdFrom = message.fwdFrom;
  if (!fwdFrom) return false;
  if (!sourceBotId) return true; // não foi possível resolver o bot; aceita qualquer forward como fallback

  const fromId = fwdFrom.fromId;
  if (fromId instanceof Api.PeerUser) {
    return BigInt(fromId.userId.toString()) === sourceBotId;
  }
  return false;
}

export async function pollOnce(): Promise<void> {
  const client = await createTelegramClient();

  try {
    const sourceBotId = await resolveSourceBotId(client);
    const lastMessageId = await getLastMessageId();

    const messages = await client.getMessages(config.telegramGroupId.toString(), {
      minId: lastMessageId,
      limit: 200,
    });

    // getMessages retorna do mais novo para o mais antigo; processa em ordem cronológica
    const ordered = [...messages].sort((a, b) => a.id - b.id);

    const kills: KillRecord[] = [];
    let maxMessageId = lastMessageId;

    for (const message of ordered) {
      maxMessageId = Math.max(maxMessageId, message.id);

      if (!isForwardedFromSourceBot(message, sourceBotId)) continue;

      const parsed = parseCombatCard(message.message);
      if (!parsed) continue;

      const sender = await message.getSender();
      const playerId = message.senderId ? Number(message.senderId.toString()) : 0;

      kills.push({
        messageId: message.id,
        playerId,
        playerName: displayName(sender),
        monsterName: parsed.monsterName,
      });
    }

    if (kills.length > 0) {
      await insertKills(kills);
      console.log(`Registrados ${kills.length} abate(s).`);
    }

    if (maxMessageId > lastMessageId) {
      await setLastMessageId(maxMessageId);
    }
  } finally {
    await client.disconnect();
  }
}

export async function postLeaderboard(): Promise<void> {
  const client = await createTelegramClient();
  try {
    const text = await buildLeaderboardMessage();
    await client.sendMessage(config.telegramGroupId.toString(), { message: text });
  } finally {
    await client.disconnect();
  }
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;
if (isMainModule) {
  pollOnce()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
