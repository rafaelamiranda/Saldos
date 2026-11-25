-- meus saldos — schema inicial
-- Rode no Supabase: SQL Editor → cole este arquivo → Run.
-- Cada tabela tem user_id e RLS: cada usuário só lê e escreve as próprias linhas.

create extension if not exists pgcrypto;

-- configurações (1 linha por usuário)
create table if not exists public.configuracoes (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  saldo_inicial numeric(12,2),
  data_saldo_inicial date,
  previsao_divisor text not null default '30' check (previsao_divisor in ('30','mes')),
  tema text not null default 'sistema' check (tema in ('claro','escuro','sistema')),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  cor text not null default '#7a7a80' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  fechamento smallint not null check (fechamento between 1 and 31),
  vencimento smallint not null check (vencimento between 1 and 31),
  created_at timestamptz not null default now()
);

create table if not exists public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('E','S','D','Eco','C')),
  valor numeric(12,2) not null check (valor > 0),
  descricao text not null default '' check (char_length(descricao) <= 200),
  data date not null,
  repeticao text not null default 'none' check (repeticao in ('none','mensal','semanal','diario','parcelado')),
  vezes integer not null default 0 check (vezes between 0 and 1000),
  tag_ids uuid[] not null default '{}',
  cartao_id uuid references public.cartoes(id) on delete set null,
  excecoes date[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists movimentacoes_user_data_idx on public.movimentacoes (user_id, data);

create table if not exists public.previsao_itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null default '' check (char_length(nome) <= 60),
  valor numeric(12,2) not null default 0 check (valor >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dia date not null,
  primary key (user_id, dia)
);

-- updated_at automático
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists movimentacoes_updated on public.movimentacoes;
create trigger movimentacoes_updated before update on public.movimentacoes
  for each row execute function public.set_updated_at();
drop trigger if exists configuracoes_updated on public.configuracoes;
create trigger configuracoes_updated before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- impede usar o cartão de outro usuário
create or replace function public.check_cartao_owner() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.cartao_id is not null and not exists (
    select 1 from public.cartoes c where c.id = new.cartao_id and c.user_id = new.user_id
  ) then
    raise exception 'cartão inválido';
  end if;
  return new;
end $$;
drop trigger if exists movimentacoes_cartao_owner on public.movimentacoes;
create trigger movimentacoes_cartao_owner before insert or update on public.movimentacoes
  for each row execute function public.check_cartao_owner();

-- RLS: só o dono
do $$
declare t text;
begin
  foreach t in array array['configuracoes','tags','cartoes','movimentacoes','previsao_itens','checkins'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists "dono" on public.%I', t);
    execute format($p$create policy "dono" on public.%I for all to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)$p$, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
