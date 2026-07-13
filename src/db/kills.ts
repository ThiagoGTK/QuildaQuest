import { supabase } from "./client.js";

export interface KillRecord {
  messageId: number;
  playerId: number;
  playerName: string;
  monsterName: string;
}

export async function getLastMessageId(): Promise<number> {
  const { data, error } = await supabase
    .from("sync_state")
    .select("last_message_id")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return Number(data.last_message_id);
}

export async function setLastMessageId(messageId: number): Promise<void> {
  const { error } = await supabase
    .from("sync_state")
    .update({ last_message_id: messageId })
    .eq("id", 1);

  if (error) throw error;
}

export async function insertKills(kills: KillRecord[]): Promise<void> {
  if (kills.length === 0) return;

  const { error } = await supabase.from("kills").upsert(
    kills.map((kill) => ({
      message_id: kill.messageId,
      player_id: kill.playerId,
      player_name: kill.playerName,
      monster_name: kill.monsterName,
    })),
    { onConflict: "message_id", ignoreDuplicates: true }
  );

  if (error) throw error;
}

export interface PlayerLeaderboardEntry {
  playerName: string;
  kills: number;
}

export async function getPlayerLeaderboard(): Promise<PlayerLeaderboardEntry[]> {
  const { data, error } = await supabase.from("kills").select("player_name");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.player_name, (counts.get(row.player_name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([playerName, kills]) => ({ playerName, kills }))
    .sort((a, b) => b.kills - a.kills);
}

export interface MonsterLeaderboardEntry {
  monsterName: string;
  kills: number;
}

export async function getMonsterLeaderboard(): Promise<MonsterLeaderboardEntry[]> {
  const { data, error } = await supabase.from("kills").select("monster_name");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.monster_name, (counts.get(row.monster_name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([monsterName, kills]) => ({ monsterName, kills }))
    .sort((a, b) => b.kills - a.kills);
}
