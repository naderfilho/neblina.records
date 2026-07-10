import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/ai";

export const runtime = "nodejs";

/** Soma local (tabela ai_usage) — só cobre chamadas registradas por este app. */
async function localSum() {
  const supabase = await createClient();
  const { data } = await supabase.from("ai_usage").select("cost_usd,created_at").limit(10000);
  const now = new Date();
  let total = 0, month = 0, count = 0;
  for (const r of (data ?? []) as { cost_usd: number; created_at: string }[]) {
    const c = Number(r.cost_usd) || 0;
    total += c; count++;
    const d = new Date(r.created_at);
    if (d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()) month += c;
  }
  return { total, month, count, source: "local" as const };
}

/**
 * Gasto da Neblina IA. Se ANTHROPIC_ADMIN_KEY estiver configurada, busca o gasto
 * REAL da organização na Admin API da Anthropic (inclui todo o histórico da key).
 * Caso contrário, cai na soma local (só o que este app registrou).
 */
export async function GET() {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
    if (!adminKey) return NextResponse.json(await localSum());

    const now = new Date();
    const startYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const params = new URLSearchParams({
      starting_at: startYear.toISOString(),
      ending_at: now.toISOString(),
    });
    const res = await fetch(`https://api.anthropic.com/v1/organizations/cost_report?${params.toString()}`, {
      headers: { "x-api-key": adminKey, "anthropic-version": "2023-06-01" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ ...(await localSum()), note: `Admin API HTTP ${res.status}` });
    }
    const json = await res.json();
    let total = 0, month = 0;
    for (const bucket of (json.data ?? []) as { starting_at?: string; ending_at?: string; results?: { amount?: number | string; cost?: number | string }[] }[]) {
      const bDate = new Date(bucket.starting_at ?? bucket.ending_at ?? now.toISOString());
      for (const r of bucket.results ?? []) {
        const amt = Number(r.amount ?? r.cost ?? 0) || 0;
        total += amt;
        if (bDate.getUTCFullYear() === now.getUTCFullYear() && bDate.getUTCMonth() === now.getUTCMonth()) month += amt;
      }
    }
    return NextResponse.json({ total, month, source: "anthropic" });
  } catch {
    return NextResponse.json(await localSum());
  }
}
