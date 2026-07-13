# QuildaQuest

Conta os abates de monstros da guilda a partir dos cards "⚔️ COMBATE INICIADO" que os
jogadores encaminham no grupo do Telegram (do bot de jogo, ex: Teletofus), e monta um
placar por jogador e por monstro.

**Fase 1 (atual):** contagem por jogador a partir dos cards encaminhados no grupo.
**Fase 2 (futuro):** ler o "Quadro de Extermínio" (menu Guilda → Tarefas do bot do jogo) e
avisar 5 minutos antes de cada tarefa da guilda expirar.

## Como funciona

Um bot próprio do Telegram (criado via [@BotFather](https://t.me/BotFather), API oficial
de bots) fica dentro do grupo da guilda com o "privacy mode" desativado, o que permite ler
todas as mensagens do grupo — sem precisar automatizar nenhuma conta pessoal.

Um workflow do GitHub Actions roda a cada hora, busca mensagens novas no grupo (via
`getUpdates`), identifica os cards de combate encaminhados do bot do jogo, extrai o nome
do monstro e quem encaminhou, grava no Supabase (Postgres) e te avisa por mensagem privada
(DM) sobre os abates novos. O placar consolidado pode ser postado no grupo a qualquer
momento disparando o workflow "Post leaderboard" manualmente.

## Setup

### 1. Criar o bot no BotFather

1. Fale com [@BotFather](https://t.me/BotFather), rode `/newbot` e siga o assistente.
2. Anote o token gerado (`TELEGRAM_BOT_TOKEN`).
3. Ainda no BotFather, rode `/setprivacy`, selecione seu bot e escolha **Disable** — sem
   isso o bot só enxerga comandos endereçados a ele, não as mensagens normais do grupo.
4. Adicione o bot ao grupo da guilda como membro comum (não precisa ser admin).
5. No privado, dê `/start` no seu bot — é para lá que ele vai te mandar as notificações.

### 2. Configurar variáveis de ambiente

```bash
npm install
cp .env.example .env
# preencha TELEGRAM_BOT_TOKEN no .env
```

### 3. Descobrir os chat IDs

Com o bot já no grupo e após você ter mandado `/start` nele no privado, rode:

```bash
npm run whoami
```

O script lista os chats vistos recentemente. Preencha `TELEGRAM_GROUP_ID` (o do grupo,
negativo, ex: `-1001234567890`) e `TELEGRAM_OWNER_CHAT_ID` (o do seu chat privado com o
bot) no `.env`.

### 4. Banco de dados (Supabase)

1. Crie um projeto gratuito em https://supabase.com.
2. No SQL Editor, rode o conteúdo de [`src/db/schema.sql`](src/db/schema.sql).
3. Em Project Settings → API, copie a `Project URL` (`SUPABASE_URL`) e a
   `service_role key` (`SUPABASE_SERVICE_ROLE_KEY`).

### 5. Testar localmente

```bash
npm run poll         # busca mensagens novas, conta abates e te avisa por DM
npm run leaderboard  # posta o placar atual no grupo
```

### 6. Configurar o GitHub Actions

Em Settings → Secrets and variables → Actions do repositório, crie os secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_GROUP_ID`
- `TELEGRAM_OWNER_CHAT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

E, opcionalmente, a variável `TELEGRAM_SOURCE_BOT_USERNAME` (padrão: `Teletofus`).

Com isso, o workflow **Poll guild kills** já roda sozinho a cada hora. O workflow
**Post leaderboard** é manual — dispare em Actions → Post leaderboard → Run workflow
sempre que quiser publicar o placar no grupo.

## Estrutura

```
src/
  config.ts              # variáveis de ambiente
  telegram/bot.ts         # client da Bot API (getUpdates/sendMessage)
  telegram/parseCard.ts   # parser do card "COMBATE INICIADO"
  db/schema.sql            # schema do Supabase
  db/client.ts              # client Supabase
  db/kills.ts                # queries de abates/placar
  poll.ts                     # busca mensagens novas, grava abates e avisa por DM
  leaderboard.ts                # monta o texto do placar
scripts/
  whoami.ts                # descobre os chat IDs (grupo e DM) via getUpdates
  postLeaderboard.ts       # dispara o envio do placar
```
