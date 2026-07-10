"use client";

import { useState } from "react";
import { Cake, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Editor da data de nascimento no perfil (para promoções de aniversário). */
export default function BirthDateEditor({ userId, initial }: { userId: string; initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    const { error } = await createClient().from("profiles").update({ birth_date: value || null }).eq("id", userId);
    setSaving(false);
    if (error) { setError("Não foi possível salvar. Tente novamente."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex items-start gap-3">
      <Cake size={18} className="mt-0.5 text-teal" />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-muted">Data de nascimento</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink outline-none focus:border-brand/60"
          />
          {value !== (initial ?? "") && (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-brand flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvar
            </button>
          )}
          {saved && <span className="text-xs text-teal">Salvo!</span>}
        </div>
        <p className="mt-1 text-[11px] text-faint">Guardamos sua data para enviar descontos e promoções de aniversário.</p>
        {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
      </div>
    </div>
  );
}
