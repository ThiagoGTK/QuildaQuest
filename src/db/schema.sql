-- Rode isto uma vez no SQL Editor do Supabase para criar as tabelas do QuildaQuest.

create table if not exists kills (
  id bigint generated always as identity primary key,
  message_id bigint not null unique,
  player_id bigint not null,
  player_name text not null,
  monster_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists kills_player_id_idx on kills (player_id);
create index if not exists kills_monster_name_idx on kills (monster_name);

-- Guarda o último message_id do grupo já processado, para o poll saber de onde continuar.
create table if not exists sync_state (
  id int primary key default 1,
  last_message_id bigint not null default 0,
  constraint sync_state_singleton check (id = 1)
);

insert into sync_state (id, last_message_id)
values (1, 0)
on conflict (id) do nothing;
