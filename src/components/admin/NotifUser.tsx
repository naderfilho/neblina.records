"use client";

import { useState } from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";

/** Nome do usuário clicável: abre o contato (para o admin falar com o cliente). */
export default function NotifUser({ name, email, phone }: { name: string; email: string | null; phone: string | null }) {
  const [open, setOpen] = useState(false);
  const wa = phone ? phone.replace(/\D/g, "") : "";
  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => setOpen((o) => !o)} className="font-semibold text-brand hover:underline">
        {name}
      </button>
      {open && (
        <span className="absolute left-0 top-full z-20 mt-1 block w-60 rounded-xl border border-line bg-panel-2 p-3 text-xs shadow-xl">
          <span className="mb-1.5 block font-semibold text-ink">{name}</span>
          {email ? (
            <a href={`mailto:${email}`} className="mb-1 flex items-center gap-1.5 text-muted hover:text-brand"><Mail size={12} /> {email}</a>
          ) : <span className="mb-1 block text-faint">Sem e-mail</span>}
          {phone ? (
            <>
              <a href={`tel:${phone}`} className="mb-1 flex items-center gap-1.5 text-muted hover:text-brand"><Phone size={12} /> {phone}</a>
              {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-teal hover:underline"><MessageCircle size={12} /> WhatsApp</a>}
            </>
          ) : <span className="block text-faint">Sem telefone</span>}
        </span>
      )}
    </span>
  );
}
