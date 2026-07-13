import "dotenv/config";

// Script de uso único, rodado LOCALMENTE, para descobrir os chat IDs necessários no .env.
// Antes de rodar: dê /start no seu bot (DM) e garanta que ele já foi adicionado ao grupo
// da guilda (com alguma mensagem recente enviada lá).

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Defina TELEGRAM_BOT_TOKEN no .env antes de rodar este script.");

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const body = (await res.json()) as {
    ok: boolean;
    result: Array<{ message?: { chat: { id: number; type: string; title?: string; first_name?: string } } }>;
    description?: string;
  };

  if (!body.ok) throw new Error(body.description ?? "Falha ao consultar a Bot API.");

  const seen = new Map<number, string>();
  for (const update of body.result) {
    const chat = update.message?.chat;
    if (!chat) continue;
    const label = chat.type === "private" ? `privado — ${chat.first_name}` : `${chat.type} — ${chat.title}`;
    seen.set(chat.id, label);
  }

  if (seen.size === 0) {
    console.log(
      "Nenhum chat encontrado. Dê /start no bot no privado e mande uma mensagem qualquer no grupo, depois rode de novo."
    );
    return;
  }

  console.log("Chats encontrados:\n");
  for (const [id, label] of seen) {
    console.log(`  ${id}  (${label})`);
  }
  console.log(
    "\nUse o ID do chat privado com você em TELEGRAM_OWNER_CHAT_ID e o ID do grupo em TELEGRAM_GROUP_ID."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
