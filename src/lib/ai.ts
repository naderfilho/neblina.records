// Módulo SÓ de servidor: importa @/lib/supabase/server (next/headers), então nunca
// é incluído no bundle do cliente — a chave da Anthropic (process.env.ANTHROPIC_API_KEY)
// nunca sai do servidor.
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const AI_MODEL = process.env.NEBLINA_AI_MODEL ?? "claude-sonnet-5";

// Preços por 1 milhão de tokens (USD). Fonte: pricing oficial da Anthropic.
const RATES: Record<string, { in: number; out: number }> = {
  "claude-sonnet-5": { in: 3, out: 15 },
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-haiku-4-5": { in: 1, out: 5 },
};

// A ferramenta de busca na web é cobrada À PARTE dos tokens: US$ 10 por 1.000
// buscas = US$ 0,01 por busca. Isso NÃO aparece na contagem de tokens — era o
// custo que faltava (a pesquisa faz até 3 buscas por disco = até US$ 0,03).
const WEB_SEARCH_USD_PER_USE = 10 / 1000;

export function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export function estimateCostUsd(model: string, usage: {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  server_tool_use?: { web_search_requests?: number | null } | null;
}): number {
  const r = RATES[model] ?? RATES["claude-sonnet-5"];
  const inTok = usage.input_tokens ?? 0;
  // cache de leitura custa ~0,1x do input; cache de escrita ~1,25x (TTL 5 min)
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const out = usage.output_tokens ?? 0;

  const tokenUsd =
    (inTok * r.in + cacheRead * r.in * 0.1 + cacheWrite * r.in * 1.25 + out * r.out) / 1_000_000;

  // custo REAL por busca na web (não vem nos tokens)
  const webSearches = usage.server_tool_use?.web_search_requests ?? 0;
  const webSearchUsd = webSearches * WEB_SEARCH_USD_PER_USE;

  return tokenUsd + webSearchUsd;
}

/** Registra o custo de uma chamada da Neblina IA (para o gasto no admin). Best-effort. */
export async function recordAiUsage(
  action: string,
  model: string,
  usage: { input_tokens?: number; output_tokens?: number },
  costUsd: number,
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("ai_usage").insert({
      actor_id: user?.id ?? null,
      action,
      model,
      cost_usd: costUsd,
      input_tokens: usage.input_tokens ?? null,
      output_tokens: usage.output_tokens ?? null,
    });
  } catch {
    /* não bloqueia a resposta da IA */
  }
}

export async function isAdminRequest(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}

/** Extrai o primeiro objeto JSON de um texto (com ou sem cerca ```json). */
export function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Sem JSON na resposta");
  return JSON.parse(candidate.slice(start, end + 1));
}
