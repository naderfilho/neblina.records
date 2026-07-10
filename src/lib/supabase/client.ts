"use client";

import { createBrowserClient } from "@supabase/ssr";

function create() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Client do browser em singleton. Criando um client novo a cada chamada, o
 * auto-refresh do token não rodava de forma contínua: em páginas longas (ex.:
 * cadastrar um disco, com upload de capa, IA e áudios) o access token expirava
 * (~1h) e as escritas chegavam ao Postgres sem `auth.uid()`, sendo recusadas
 * pela RLS com "new row violates row-level security policy".
 */
let browserClient: ReturnType<typeof create> | undefined;

export function createClient() {
  if (!browserClient) browserClient = create();
  return browserClient;
}
