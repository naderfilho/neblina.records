"use client";

import { useState } from "react";
import { Ticket, Loader2, Copy, Check, Trash2, Power } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type CouponRow = {
  id: string; code: string; discount_percent: number; user_id: string | null;
  description: string | null; expires_at: string | null; is_active: boolean;
  redeemed_at: string | null; created_at: string; userName?: string | null;
};

function isExpired(c: CouponRow) {
  return !!c.expires_at && new Date(c.expires_at) < new Date();
}
/** Normaliza o nome do cupom: maiúsculas, sem espaços/acentos (fica fácil de digitar). */
function normalizeCode(raw: string) {
  return raw
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export default function CouponsAdmin({ coupons }: { coupons: CouponRow[] }) {
  const [items, setItems] = useState<CouponRow[]>(coupons);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // criar cupom (global — vale para todo mundo)
  const [dCode, setDCode] = useState("");
  const [dPercent, setDPercent] = useState("15");
  const [dExpiry, setDExpiry] = useState(""); // vazio = não expira
  const [dDesc, setDDesc] = useState("");

  async function createCoupon() {
    setError(null);
    const code = normalizeCode(dCode);
    const pct = parseInt(dPercent);
    if (!code) { setError("Dê um nome ao cupom (ex.: NEBLINA15)."); return; }
    if (!pct || pct < 1 || pct > 100) { setError("Informe um desconto entre 1 e 100%."); return; }
    setBusy("create");
    try {
      const supabase = createClient();
      const expires = dExpiry ? new Date(dExpiry + "T23:59:59").toISOString() : null;
      const { data, error } = await supabase
        .from("coupons")
        .insert({ code, discount_percent: pct, user_id: null, description: dDesc.trim() || null, expires_at: expires })
        .select("*").single();
      if (error) {
        if (/duplicate key|unique/i.test(error.message)) throw new Error(`Já existe um cupom "${code}". Escolha outro nome.`);
        throw error;
      }
      const coupon = data as CouponRow;
      logAction("create", "coupon", coupon.id, `Cupom ${code} (${pct}%)`, { cupom: code });
      setItems((p) => [coupon, ...p]);
      setDCode(""); setDPercent("15"); setDExpiry(""); setDDesc("");
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

      {/* CRIAR CUPOM */}
      <section className="card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Ticket size={18} className="text-brand" />
          <h2 className="font-display text-xl text-ink">Criar cupom</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          O cupom vale para <strong className="text-ink">todo mundo</strong>. Basta divulgar o nome — quem estiver logado
          vê o desconto na conta e ele entra sozinho na mensagem da compra pelo WhatsApp.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Nome do cupom</span>
            <input
              value={dCode}
              onChange={(e) => setDCode(e.target.value)}
              onBlur={() => setDCode((v) => normalizeCode(v))}
              placeholder="NEBLINA15"
              className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-ink outline-none focus:border-brand/50"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Desconto (%)</span>
            <input type="number" min={1} max={100} value={dPercent} onChange={(e) => setDPercent(e.target.value)} className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Validade (vazio = não expira)</span>
            <input type="date" value={dExpiry} onChange={(e) => setDExpiry(e.target.value)} className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <label className="block">
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
                <tr><th className="px-4 py-3">Cupom</th><th className="px-4 py-3">Desconto</th><th className="px-4 py-3">Alcance</th><th className="px-4 py-3">Validade</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ações</th></tr>
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
                      <td className="px-4 py-3 text-muted">{c.user_id ? (c.userName ?? "1 cliente") : "Todos"}</td>
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
