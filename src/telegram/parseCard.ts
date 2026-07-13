export interface ParsedCombatCard {
  monsterName: string;
}

const COMBAT_START_MARKER = "COMBATE INICIADO";

// Remove emojis/símbolos e espaços do início da linha do monstro (ex: "🧙 Guardião da Mata" -> "Guardião da Mata")
const LEADING_SYMBOLS_REGEX = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}‍️\s]+/u;

/**
 * Extrai o nome do monstro de um card "COMBATE INICIADO" encaminhado do bot do jogo.
 * Retorna null se o texto não for um card desse tipo.
 */
export function parseCombatCard(text: string | undefined | null): ParsedCombatCard | null {
  if (!text) return null;

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const startIndex = lines.findIndex((line) => line.toUpperCase().includes(COMBAT_START_MARKER));
  if (startIndex === -1) return null;

  const monsterLine = lines[startIndex + 1];
  if (!monsterLine) return null;

  const monsterName = monsterLine.replace(LEADING_SYMBOLS_REGEX, "").trim();
  if (!monsterName) return null;

  return { monsterName };
}
