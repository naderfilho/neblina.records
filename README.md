# 🎵 Neblina Records — Loja de Discos de Vinil

Loja online de vinis com abertura animada, discos que giram e tocam ao passar o mouse (ou tocar no celular), cursor em formato de agulha, painel administrativo completo e área de eventos.

Feito por **NDR Private Agency**.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **Supabase** — Auth, Postgres (RLS) e Storage
- **Framer Motion** — animações

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000

As variáveis já estão em `.env.local` (URL do Supabase, chaves e WhatsApp).

## Banco de dados

O schema completo está em [`supabase/schema.sql`](supabase/schema.sql) — **já aplicado** no projeto Supabase.
Se precisar recriar do zero, cole o arquivo inteiro no SQL Editor do Supabase.

Buckets de Storage criados: `covers`, `record-photos`, `audio` (públicos para leitura).

## Acesso admin

- **E-mail:** contato@example.com
- **Senha:** neblina2001
- Painel em `/admin` (discos, inventário, usuários, eventos).

Para adicionar outro admin, insira o e-mail na tabela `admin_emails` — ao se cadastrar, a pessoa vira admin automaticamente.

## Estrutura

```
src/
  app/
    (site)/        → home, disco/[id], eventos, sobre, conta
    admin/         → painel (discos, usuarios, eventos)
    login, cadastro
  components/      → Vinyl, CursorNeedle, IntroCurtain, RecordGrid, admin/*
  lib/             → supabase clients, cart, constants, types
```

## Deploy (Vercel)

1. Suba o repositório no GitHub.
2. Importe na Vercel.
3. Adicione as variáveis do `.env.local` nas Environment Variables.
4. Deploy.
