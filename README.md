# meus saldos

Controle financeiro pessoal: saldo diário projetado, totais do mês, tags, cartões, previsão de diário e horizonte de 12 meses.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Supabase (Auth + Postgres com RLS) · Vercel

## Segurança

- **Login obrigatório** (e-mail + senha via Supabase Auth). O `middleware.ts` barra toda rota sem sessão válida e o layout logado confere de novo no servidor com `getUser()`, que valida o token no Supabase.
- **Lista de e-mails autorizados** (`ALLOWED_EMAILS`): mesmo que alguém crie uma conta no seu projeto, é deslogado e não entra.
- **RLS em todas as tabelas** (`force row level security`): cada usuário só lê e escreve as próprias linhas. O papel `anon` não tem acesso a nenhuma tabela. Um trigger impede apontar um lançamento para o cartão de outro usuário.
- Cabeçalhos: `X-Frame-Options: DENY`, HSTS, `nosniff`, `noindex`.
- A chave `anon` é pública por natureza: quem protege os dados é o RLS. **Nunca** coloque a `service_role` em variável `NEXT_PUBLIC_*`.

## Configuração

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. **SQL Editor** → cole `supabase/migrations/0001_init.sql` → **Run**.
3. **Authentication → Sign In / Providers**:
   - Email: ligado.
   - **Allow new users to sign up: desligado** (ninguém cria conta pela internet).
4. **Authentication → Users → Add user → Create new user**: seu e-mail e uma senha forte, com **Auto Confirm User** marcado.
5. **Authentication → URL Configuration**:
   - Site URL: `https://SEU-DOMINIO.vercel.app`
   - Redirect URLs: `https://SEU-DOMINIO.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`
6. Recomendado: **Authentication → Multi-Factor** e as proteções de senha vazada e de comprimento mínimo, nas configurações de senha.

### 2. Rodar local

```bash
cp .env.example .env.local   # preencha com Project Settings → API
npm install
npm run dev                  # http://localhost:3000
```

### 3. Vercel

1. Suba o projeto para um repositório **privado** no GitHub.
2. Na Vercel: **Add New → Project** → importe o repositório (o framework Next.js é detectado sozinho).
3. Em **Environment Variables**, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ALLOWED_EMAILS` (seu e-mail)
4. Deploy. Depois, atualize a Site URL no Supabase (passo 1.5) com o domínio final.

## Trazer os dados do protótipo

No protótipo: **menu → configurações → copiar backup**. No sistema: **menu → configurações → importar backup do protótipo** → cole → importar. Tags, cartões, lançamentos (inclusive recorrentes), previsão, check-ins e saldo inicial são somados ao que já existe.

## Estrutura

```
middleware.ts                 # protege as rotas e aplica ALLOWED_EMAILS
supabase/migrations/          # schema + RLS
lib/engine.ts                 # cálculos: recorrências, saldo diário, faturas
lib/store.tsx                 # carrega e grava no Supabase (client-side, protegido por RLS)
app/login                     # login + recuperar senha
app/auth/callback             # link de e-mail (recuperar senha)
app/(app)/saldos|totais|tags|horizonte|menu/...
```

## Regras de cálculo

- **saldo do dia** = saldo anterior + entradas − saídas − diários − economias − cartão − previsão de diário (só em dias futuros)
- **performance** = entradas − saídas − diários − economias − cartão − previsão dos dias restantes
- **custo de vida** = saídas + diários + cartão + previsão dos dias restantes
- **diário médio** = diários do mês ÷ dias decorridos
- **cores do saldo**: < −500 · < 0 · ≤ 1.000 · ≤ 2.000 · acima
- **usar vencimento** (cartão): compra até o dia do fechamento cai no vencimento seguinte; depois do fechamento, no próximo.
