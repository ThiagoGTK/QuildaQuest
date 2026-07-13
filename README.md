# QuildaQuest

Conta os abates de monstros da guilda a partir dos cards "⚔️ COMBATE INICIADO" que os
jogadores encaminham no grupo do Telegram (do bot de jogo, ex: Teletofus), e monta um
placar por jogador e por monstro.

**Fase 1 (atual):** contagem por jogador a partir dos cards encaminhados no grupo.
**Fase 2 (futuro):** ler o "Quadro de Extermínio" (menu Guilda → Tarefas do bot do jogo) e
avisar 5 minutos antes de cada tarefa da guilda expirar.

## Como funciona

Um userbot (conta pessoal do Telegram, via [GramJS](https://gram.js.org/)) lê o grupo da
guilda periodicamente. Como um bot comum não consegue ler mensagens normais do grupo sem
o admin desativar o "privacy mode", usamos a API do usuário (MTProto) para isso.

Um workflow do GitHub Actions roda a cada 5 minutos, busca mensagens novas no grupo,
identifica os cards de combate encaminhados do bot do jogo, extrai o nome do monstro e
quem encaminhou, e grava no Supabase (Postgres). O placar pode ser postado no grupo a
qualquer momento disparando o workflow "Post leaderboard" manualmente.

> **Atenção:** automatizar uma conta pessoal do Telegram (userbot) está fora dos Termos de
> Uso oficiais do Telegram para automação. Para um grupo privado e uso de baixo volume o
> risco é baixo, mas existe (a conta pode sofrer restrições se o Telegram detectar padrão
> automatizado).

## Setup

### 1. Credenciais da API do Telegram

Crie um app em https://my.telegram.org/apps e anote `api_id` e `api_hash`.

### 2. Gerar a sessão (uma única vez, local)

```bash
npm install
cp .env.example .env
# preencha TELEGRAM_API_ID e TELEGRAM_API_HASH no .env
npm run login
```

Siga o prompt (telefone, código recebido no Telegram, senha de 2FA se houver). No final,
o script imprime uma string longa — cole em `TELEGRAM_SESSION` no `.env` e também como
secret no GitHub (veja abaixo). **Nunca** commite esse valor.

### 3. ID do grupo

Encaminhe qualquer mensagem do grupo da guilda para [@userinfobot](https://t.me/userinfobot)
ou use o próprio client para descobrir o ID (negativo, ex: `-1001234567890`). Preencha
`TELEGRAM_GROUP_ID` no `.env`.

### 4. Banco de dados (Supabase)

1. Crie um projeto gratuito em https://supabase.com.
2. No SQL Editor, rode o conteúdo de [`src/db/schema.sql`](src/db/schema.sql).
3. Em Project Settings → API, copie a `Project URL` (`SUPABASE_URL`) e a
   `service_role key` (`SUPABASE_SERVICE_ROLE_KEY`).

### 5. Testar localmente

```bash
npm run poll         # busca mensagens novas e conta abates
npm run leaderboard  # posta o placar atual no grupo
```

### 6. Configurar o GitHub Actions

Em Settings → Secrets and variables → Actions do repositório, crie os secrets:

- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `TELEGRAM_SESSION`
- `TELEGRAM_GROUP_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

E, opcionalmente, a variável `TELEGRAM_SOURCE_BOT_USERNAME` (padrão: `Teletofus`).

Com isso, o workflow **Poll guild kills** já roda sozinho a cada 5 minutos. O workflow
**Post leaderboard** é manual — dispare em Actions → Post leaderboard → Run workflow
sempre que quiser publicar o placar no grupo.

## Estrutura

```
src/
  config.ts              # variáveis de ambiente
  telegram/client.ts      # client GramJS
  telegram/parseCard.ts   # parser do card "COMBATE INICIADO"
  db/schema.sql            # schema do Supabase
  db/client.ts              # client Supabase
  db/kills.ts                # queries de abates/placar
  poll.ts                     # busca mensagens novas e grava abates
  leaderboard.ts                # monta o texto do placar
scripts/
  login.ts                # gera a TELEGRAM_SESSION (rodar 1x, local)
  postLeaderboard.ts       # dispara o envio do placar
```
