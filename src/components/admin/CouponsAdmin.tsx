"use client";

import { useMemo, useState } from "react";
import { Ticket, Gift, Loader2, Copy, Check, Trash2, Power, Search, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type CouponRow = {
  id: string; code: string; discount_percent: number; user_id: string | null;
  description: string | null; expires_at: string | null; is_active: boolean;
  redeemed_at: string | null; created_at: string; userName?: string | null;
};
export type NewClient = { id: string; first_name: string | null; last_name: string | null; email: string | null; created_at: string };
export type CustomerOpt = { id: string; name: string; email: string | null };

function genCode(prefix = "NEB") {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}
function isExpired(c: CouponRow) {
  return !!c.expires_at && new Date(c.expires_at) < new Date();
}

export default function CouponsAdmin({
  coupons, newClients, customers,
}: { coupons: CouponRow[]; newClients: NewClient[]; customers: CustomerOpt[] }) {
  const [items, setItems] = useState<CouponRow[]>(coupons);
  const [clients, setClients] = useState<NewClient[]>(newClients);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // validade compartilhada da seção de boas-vindas (dias)
  const [welcomeDays, setWelcomeDays] = useState("30");

  // criar cupom
  const [dPercent, setDPercent] = useState("10");
  const [dExpiry, setDExpiry] = useState(daysFromNow(30));
  const [dUser, setDUser] = useState<string>(""); // "" = geral
  const [dDesc, setDDesc] = useState("");
  const [custSearch, setCustSearch] = useState("");

  const nameOf = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);
  const custResults = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => `${c.name} ${c.email ?? ""}`.toLowerCase().includes(q)).slice(0, 8);
  }, [custSearch, customers]);

  async function insertCoupon(payload: {
    discount_percent: number; user_id: string | null; description: string | null; expires_at: string | null;
  }): Promise<CouponRow | null> {
    const supabase = createClient();
    for (let attempt = 0; attempt < 4; attempt++) {
      const code = genCode(`NEB${payload.discount_percent}`);
      const { data, error } = await supabase.from("coupons").insert({ ...payload, code }).select("*").single();
      if (!error && data) return data as CouponRow;
      if (error && !/duplicate key|unique/i.test(error.message)) throw error; // erro real
    }
    throw new Error("Não consegui gerar um código único. Tente de novo.");
  }

  async function notifyUser(userId: string, percent: number, code: string, expiresAt: string | null) {
    const supabase = createClient();
    const quando = expiresAt ? ` Válido até ${formatDate(expiresAt)}.` : "";
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "custom",
      title: `🎟️ Você ganhou ${percent}% de desconto!`,
      body: `Use o cupom ${code} na sua próxima compra pelo WhatsApp.${quando}`,
      link: "/conta",
    });
  }

  async function sendWelcome(client: NewClient) {
    setError(null);
    setBusy(client.id);
    try {
      const days = Math.max(1, parseInt(welcomeDays) || 30);
      const expires = new Date(Date.now() + days * 86400000).toISOString();
      const coupon = await insertCoupon({ discount_percent: 15, user_id: client.id, description: "Boas-vindas", expires_at: expires });
      if (coupon) {
        await notifyUser(client.id, 15, coupon.code, expires);
        const supabase = createClient();
        await supabase.from("profiles").update({ welcomed_at: new Date().toISOString() }).eq("id", client.id);
        logAction("create", "coupon", coupon.id, `Cupom 15% -> ${client.email ?? client.id}`, { cupom: coupon.code });
        setItems((p) => [{ ...coupon, userName: `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || client.email }, ...p]);
        setClients((p) => p.filter((c) => c.id !== client.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar o cupom.");
    }
    setBusy(null);
  }

  async function dismiss(client: NewClient) {
    setBusy(client.id);
    const supabase = createClient();
    await supabase.from("profiles").update({ welcomed_at: new Date().toISOString() }).eq("id", client.id);
    setClients((p) => p.filter((c) => c.id !== client.id));
    setBusy(null);
  }

  async function createCoupon() {
    setError(null);
    const pct = parseInt(dPercent);
    if (!pct || pct < 1 || pct > 100) { setError("Informe um desconto entre 1 e 100%."); return; }
    setBusy("create");
    try {
      const expires = dExpiry ? new Date(dExpiry + "T23:59:59").toISOString() : null;
      const coupon = await insertCoupon({ discount_percent: pct, user_id: dUser || null, description: dDesc.trim() || null, expires_at: expires });
      if (coupon) {
        if (dUser) await notifyUser(dUser, pct, coupon.code, expires);
        setItems((p) => [{ ...coupon, userName: dUser ? nameOf.get(dUser) ?? null : null }, ...p]);
        setDDesc(""); setCustSearch(""); setDUser("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar o cupom.");
    }
    setBusy(null);
  }

  async function toggleActive(c: CouponRow) {
    setBusy(c.id);
    const supabase = createClient();
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    setItems((p) => p.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
    setBusy(null);
  }
  async function remove(c: CouponRow) {
    if (!confirm(`Excluir o cupom ${c.code}?`)) return;
    setBusy(c.id);
    const supabase = createClient();
    await supabase.from("coupons").delete().eq("id", c.id);
    setItems((p) => p.filter((x) => x.id !== c.id));
    setBusy(null);
  }
  async function copy(code: string) {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1800); } catch { /* noop */ }
  }

  return (
    <div className="space-y-8">
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {/* NOVOS CLIENTES */}
      <section className="card p-6">
        <div className="mb-1 flex items-center gap-2">
          <UserPlus size={18} className="text-brand" />
          <h2 className="font-display text-xl text-ink">Novos clientes</h2>
          <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand">{clients.length}</span>
        </div>
        <p className="mb-4 text-sm text-muted">Cada cliente que se cadastra aparece aqui. Envie o cupom de 15% de boas-vindas (o cliente recebe uma notificação).</p>

        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-muted">Validade do cupom:</span>
          <input type="number" min={1} value={welcomeDays} onChange={(e) => setWelcomeDays(e.target.value)} className="w-20 rounded-lg border border-line bg-panel px-2 py-1 text-ink outline-none focus:border-brand/50" />
          <span className="text-muted">dias</span>
        </div>

        {clients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-faint">Nenhum cadastro novo pendente. 🎉</p>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-bg-soft p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Sem nome"}</p>
                  <p className="truncate text-xs text-muted">{c.email} · cadastrou em {formatDate(c.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => sendWelcome(c)} disabled={busy === c.id} className="btn-brand flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-60">
                    {busy === c.id ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />} Enviar cupom de 15%
                  </button>
                  <button onClick={() => dismiss(c)} disabled={busy === c.id} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:text-ink disabled:opacity-60">Dispensar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CRIAR CUPOM */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Ticket size={18} className="text-brand" />
          <h2 className="font-display text-xl text-ink">Criar cupom</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Desconto (%)</span>
            <input type="number" min={1} max={100} value={dPercent} onChange={(e) => setDPercent(e.target.value)} className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Validade (deixe vazio p/ não expirar)</span>
            <input type="date" value={dExpiry} onChange={(e) => setDExpiry(e.target.value)} className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <div className="relative sm:col-span-2">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Para quem</span>
            {dUser ? (
              <div className="flex items-center justify-between rounded-xl border border-brand/40 bg-brand/10 px-3 py-2.5 text-sm">
                <span className="text-ink">{nameOf.get(dUser) ?? "cliente"}</span>
                <button type="button" onClick={() => setDUser("")} className="text-xs text-faint hover:text-red-400">trocar</button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input value={custSearch} onChange={(e) => setCustSearch(e.target.value)} placeholder="Buscar cliente (ou deixe vazio = cupom geral)" className="w-full rounded-xl border border-line bg-bg-soft py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand/50" />
                </div>
                {custResults.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-panel shadow-xl">
                    {custResults.map((c) => (
                      <button key={c.id} type="button" onClick={() => { setDUser(c.id); setCustSearch(""); }} className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-bg-soft">
                        <span className="text-ink">{c.name}</span><span className="text-xs text-muted">{c.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Descrição (opcional)</span>
            <input value={dDesc} onChange={(e) => setDDesc(e.target.value)} placeholder="Ex: Promo de aniversário" className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
        </div>
        <button onClick={createCoupon} disabled={busy === "create"} className="btn-brand mt-4 flex items-center gap-2 rounded-xl px-5 py-3 text-sm disabled:opacity-60">
          {busy === "create" ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />} Gerar cupom
        </button>
      </section>

      {/* LISTA DE CUPONS */}
      <section className="card p-6">
        <h2 className="mb-4 font-display text-xl text-ink">Cupons ({items.length})</h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-faint">Nenhum cupom ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-bg-soft text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Desconto</th><th className="px-4 py-3">Para</th><th className="px-4 py-3">Validade</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((c) => {
                  const expired = isExpired(c);
                  return (
                    <tr key={c.id} className="hover:bg-panel/40">
                      <td className="px-4 py-3">
                        <button onClick={() => copy(c.code)} className="inline-flex items-center gap-1.5 rounded-lg bg-panel px-2 py-1 font-mono text-xs font-bold text-brand hover:bg-panel-2" title="Copiar">
                          {copied === c.code ? <Check size={12} className="text-teal" /> : <Copy size={12} />} {c.code}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{c.discount_percent}%</td>
                      <td className="px-4 py-3 text-muted">{c.user_id ? (c.userName ?? "cliente") : "Geral"}</td>
                      <td className="px-4 py-3 text-muted">{c.expires_at ? formatDate(c.expires_at) : "sem prazo"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs",
                          c.redeemed_at ? "bg-panel-2 text-faint" : expired ? "bg-red-500/15 text-red-300" : c.is_active ? "bg-teal/15 text-teal" : "bg-panel-2 text-faint")}>
                          {c.redeemed_at ? "Usado" : expired ? "Expirado" : c.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleActive(c)} disabled={busy === c.id} className="rounded-lg p-2 text-muted hover:text-brand disabled:opacity-40" title={c.is_active ? "Desativar" : "Ativar"}><Power size={15} /></button>
                          <button onClick={() => remove(c)} disabled={busy === c.id} className="rounded-lg p-2 text-muted hover:text-red-400 disabled:opacity-40" title="Excluir"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
