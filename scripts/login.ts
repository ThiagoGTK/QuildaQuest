import "dotenv/config";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import * as readline from "node:readline/promises";

// Script de uso único, rodado LOCALMENTE, para gerar a TELEGRAM_SESSION.
// Nunca rode isso em CI/produção — o login é interativo (código enviado ao seu Telegram).

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question: string) => rl.question(question);

async function main() {
  const apiId = Number(process.env.TELEGRAM_API_ID ?? (await ask("TELEGRAM_API_ID: ")));
  const apiHash = process.env.TELEGRAM_API_HASH ?? (await ask("TELEGRAM_API_HASH: "));

  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 3,
  });

  await client.start({
    phoneNumber: async () => await ask("Número de telefone (com DDI, ex: +5511999999999): "),
    password: async () => await ask("Senha de verificação em duas etapas (se houver): "),
    phoneCode: async () => await ask("Código recebido no Telegram: "),
    onError: (err) => console.error(err),
  });

  console.log("\nLogin concluído. Copie o valor abaixo para TELEGRAM_SESSION no seu .env / GitHub Secrets:\n");
  console.log(client.session.save());

  await client.disconnect();
  rl.close();
}

main();
