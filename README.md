# Neblina Records

Loja online de discos de vinil com experiência imersiva: abertura cinematográfica, discos que giram e tocam ao passar o mouse (ou ao toque, no celular), cursor em formato de agulha, gatefold que abre, Audioteca com toca-discos virtual — e um painel administrativo completo com cadastro assistido por IA.

**Site em produção:** [neblinarecords.com.br](https://www.neblinarecords.com.br)

Projetado e desenvolvido do zero por **[Nader Filho](https://github.com/naderfilho)** · NDR Private Agency.

---

## O produto

### Loja (público)

- Catálogo com **3.100+ discos**, busca em todo o acervo, filtros por gênero/tag/artista e paginação
- **Vinil interativo**: o disco gira, toca prévia de áudio no hover, tem sulcos clicáveis por faixa (lados A/B), flip de lado e capa que se revela em animação
- **Boxes (box sets)** com leque interativo de discos e página cinematográfica
- **Audioteca**: toca-discos virtual em 3 colunas com fila, player em segundo plano, equalizador e níveis de acesso (público / membros)
- Carrinho, favoritos, cupons de desconto (com boas-vindas automáticas), cálculo de frete, propostas de compra via WhatsApp
- **"Venda seu disco"**: fluxo público de proposta de venda com gestão no admin
- Agenda de eventos da loja, comentários com respostas, notificações in-app
- Sistema de condição **Goldmine Grading** (M/NM/VG+...) padrão do mercado de vinil

### Painel administrativo (18 módulos)

Gestão completa de discos (com clonagem, ordenação drag-and-drop, edição em massa de tags), boxes, cupons, usuários, eventos, propostas de venda, notificações broadcast, música da home e Audioteca — mais:

- **Analytics**: acessos do site (dia/hora/dia da semana), views por disco/box
- **Financeiro**: custo de aquisição, lucro e valor de inventário (com botão de ocultar)
- **Auditoria**: histórico de todas as ações administrativas, com autor e detalhes
- **Ferramentas de mídia**: cropper de imagem, trimmer de áudio e designer visual da bolacha do vinil (ou CD reflexivo)

### Neblina IA (Claude API · Anthropic)

- **Identificação por foto**: fotografe a capa e a IA preenche título, artista, gênero, ano, gravadora e descrição (visão computacional)
- **Pesquisa profunda**: com artista + número de catálogo, a IA busca no Discogs a tracklist, história do álbum, dados de prensagem (matriz, mono/estéreo) e faixa de preço de mercado
- **Governança de custo**: cada chamada tem custo estimado (tokens + buscas web), registrado em banco e exibido em dashboard de gastos no admin — com fallback local quando a Admin API não está disponível

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, SSR) + **React 19** + **TypeScript** |
| Estilo & animação | **Tailwind CSS 4** · **Framer Motion** |
| Backend & dados | **Supabase** — PostgreSQL, Auth, Storage |
| IA | **Anthropic Claude API** (visão + busca web) |
| Deploy | **Vercel** |

## Arquitetura e segurança

- **Row Level Security em 100% das tabelas** — 40+ políticas nos padrões leitura pública / dono / admin; a autorização mora no banco, não na UI
- Funções RPC `SECURITY DEFINER` com verificação de permissão interna e `EXECUTE` restrito por papel (`anon` / `authenticated`)
- **Event trigger que liga RLS automaticamente** em qualquer tabela nova — segurança à prova de esquecimento
- Trilha de auditoria (`audit_log`) alimentada por função dedicada, com resolução de autor
- Autenticação SSR com `@supabase/ssr` (clients separados para browser/server e renovação de sessão via `proxy.ts`)
- Rotas de API de IA protegidas por verificação de admin **no servidor**; a chave da Anthropic nunca chega ao cliente
- Promoção de admin via tabela `admin_emails` + trigger em `auth.users` — sem credencial no código

## Estrutura

```
src/
  app/
    (site)/        → home, disco/[id], box/[id], audioteca, eventos, vender, conta
    admin/         → 18 módulos de gestão
    api/ai/        → identify (visão) e research (busca) — Claude API
    login, cadastro
  components/      → Vinyl, GatefoldViewer, Audioteca, BoxOpener, CursorNeedle, admin/*
  lib/             → supabase (client/server/middleware), ai, cart, audit, types
  proxy.ts         → renovação de sessão (middleware do Next 16)
supabase/
  schema.sql       → schema completo do banco (tabelas, RLS, funções, triggers)
  migrations/      → migrations incrementais (hardening de segurança)
```

## Rodando localmente

```bash
npm install
npm run dev
```

Crie um `.env.local` (nunca versionado) com:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic (só servidor) |
| `ANTHROPIC_ADMIN_KEY` | Opcional — Admin API para gasto real de IA |
| `NEBLINA_AI_MODEL` | Opcional — modelo Claude (default no código) |
| `NEXT_PUBLIC_SITE_URL` | URL canônica do site |
| `NEXT_PUBLIC_WHATSAPP_PRIMARY` / `_SECONDARY` | WhatsApp da loja |
| `NEXT_PUBLIC_STORE_EMAIL` / `_INSTAGRAM` / `NEXT_PUBLIC_TELEGRAM_USERNAME` | Contatos da loja |

## Banco de dados

O schema completo está em [`supabase/schema.sql`](supabase/schema.sql) — para recriar do zero, execute-o no SQL Editor do Supabase. Buckets de Storage: `covers`, `record-photos`, `audio` (leitura pública). Para tornar alguém admin, insira o e-mail na tabela `admin_emails` — no cadastro ou próximo login, o papel é promovido automaticamente pelo trigger.

## Deploy (Vercel)

1. Importe o repositório na Vercel
2. Adicione as variáveis do `.env.local` em Environment Variables
3. Deploy

---

© Nader Filho · NDR Private Agency — código disponível para leitura e avaliação; todos os direitos reservados.
