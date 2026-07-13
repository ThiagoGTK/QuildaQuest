import { getUpdates, sendMessage, type TelegramMessage, type TelegramUser } from "./telegram/bot.js";
import { parseCombatCard } from "./telegram/parseCard.js";
import { getLastUpdateId, insertKills, setLastUpdateId, type KillRecord } from "./db/kills.js";
import { buildLeaderboardMessage } from "./leaderboard.js";
import { config } from "./config.js";

function displayName(user: TelegramUser | undefined): string {
  if (!user) return "Desconhecido";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || (user.username ? `@${user.username}` : `id:${user.id}`);
}

function forwardedFromSourceBot(message: TelegramMessage): boolean {
  const origin = message.forward_origin;
  if (origin?.type === "user") {
    return origin.sender_user.username?.toLowerCase() === config.sourceBotUsername.toLowerCase();
  }
  if (message.forward_from) {
    return message.forward_from.username?.toLowerCase() === config.sourceBotUsername.toLowerCase();
  }
  return false;
}

export async function pollOnce(): Promise<void> {
  const lastUpdateId = await getLastUpdateId();
  const updates = await getUpdates(lastUpdateId + 1);

  const kills: KillRecord[] = [];
  let maxUpdateId = lastUpdateId;

  for (const update of updates) {
    maxUpdateId = Math.max(maxUpdateId, update.update_id);

    const message = update.message;
    if (!message) continue;
    if (BigInt(message.chat.id) !== config.telegramGroupId) continue;
    if (!forwardedFromSourceBot(message)) continue;

    const parsed = parseCombatCard(message.text ?? message.caption);
    if (!parsed) continue;

    kills.push({
      messageId: message.message_id,
      playerId: message.from?.id ?? 0,
      playerName: displayName(message.from),
      monsterName: parsed.monsterName,
    });
  }

  if (kills.length > 0) {
    await insertKills(kills);
    console.log(`Registrados ${kills.length} abate(s).`);

    const lines = kills.map((k) => `⚔️ ${k.playerName} abateu ${k.monsterName}`);
    await sendMessage(config.telegramOwnerChatId, lines.join("\n"));
  }

  if (maxUpdateId > lastUpdateId) {
    await setLastUpdateId(maxUpdateId);
  }
}

export async function postLeaderboard(): Promise<void> {
  const text = await buildLeaderboardMessage();
  await sendMessage(config.telegramGroupId, text);
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
