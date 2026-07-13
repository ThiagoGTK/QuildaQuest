import { getMonsterLeaderboard, getPlayerLeaderboard } from "./db/kills.js";

export async function buildLeaderboardMessage(): Promise<string> {
  const [players, monsters] = await Promise.all([getPlayerLeaderboard(), getMonsterLeaderboard()]);

  const lines: string[] = ["🏆 Placar de abates da guilda", ""];

  lines.push("Por jogador:");
  if (players.length === 0) {
    lines.push("  (nenhum abate registrado ainda)");
  } else {
    players.forEach((entry, index) => {
      lines.push(`  ${index + 1}. ${entry.playerName} — ${entry.kills}`);
    });
  }

  lines.push("", "Por monstro:");
  if (monsters.length === 0) {
    lines.push("  (nenhum abate registrado ainda)");
  } else {
    monsters.forEach((entry) => {
      lines.push(`  • ${entry.monsterName}: ${entry.kills}`);
    });
  }

  return lines.join("\n");
}
