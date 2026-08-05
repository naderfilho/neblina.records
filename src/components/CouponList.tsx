"use client";

import { useState } from "react";
import { Ticket, Copy, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Coupon } from "@/lib/types";

/** Cupons do cliente na área do perfil. Mostra o código (copiável) e a validade. */
export default function CouponList({ coupons }: { coupons: Coupon[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(code: string) {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1800); } catch { /* noop */ }
  }

  if (coupons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-10 text-center text-muted">
        <Ticket size={28} className="mx-auto mb-2 text-faint" />
        <p>Você ainda não tem cupons.</p>
        <p className="mt-1 text-sm text-faint">Quando ganhar um desconto, ele aparece aqui.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {coupons.map((c) => (
        <div key={c.id} className="relative overflow-hidden rounded-2xl border border-brand/40 bg-brand/[0.07] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-3xl font-bold text-brand">{c.discount_percent}% OFF</p>
              {c.description && <p className="text-xs text-muted">{c.description}</p>}
            </div>
            <Ticket size={26} className="text-brand/60" />
          </div>
          <button
            onClick={() => copy(c.code)}
            className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-brand/50 bg-black/20 px-3 py-2 font-mono text-sm font-bold tracking-wider text-ink transition hover:border-brand"
            title="Copiar código"
          >
            {c.code}
            {copied === c.code ? <Check size={15} className="text-teal" /> : <Copy size={15} className="text-brand" />}
          </button>
          <p className="mt-2 text-[11px] text-faint">
            {c.expires_at ? `Válido até ${formatDate(c.expires_at)}` : "Sem prazo de validade"} · use no WhatsApp da compra
          </p>
        </div>
      ))}
    </div>
  );
}
