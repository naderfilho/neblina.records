"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { STORE } from "@/lib/constants";

/**
 * Encaminhar disco para um amigo. Usa o compartilhamento nativo do aparelho
 * (navigator.share — abre WhatsApp/Telegram/etc no celular); se não existir,
 * copia o link pra área de transferência. O link é sempre o do domínio próprio.
 */
export default function ShareButton({ id, title, artist }: { id: string; title: string; artist: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${STORE.siteUrl}/disco/${id}`;
  const text = `Olha esse disco na Neblina Records: ${title} — ${artist}`;

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${title} — ${artist}`, text, url });
        return;
      } catch {
        /* usuário cancelou — ok */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copie o link do disco:", url);
    }
  }

  return (
    <button
      onClick={share}
      className="flex w-fit items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 text-xs text-muted transition-colors hover:border-brand/50 hover:text-brand"
      aria-label="Encaminhar disco"
    >
      {copied ? <Check size={14} className="text-teal" /> : <Share2 size={14} />}
      {copied ? "Link copiado!" : "Encaminhar para um amigo"}
    </button>
  );
}
