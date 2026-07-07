import { Mail, Phone, MapPin, Building2, CalendarDays, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, whatsappLink } from "@/lib/utils";
import type { EventRequest } from "@/lib/types";

export const revalidate = 0;

export default async function AdminEventosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("event_requests").select("*").order("created_at", { ascending: false });
  const reqs = (data as EventRequest[]) ?? [];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Pedidos de evento</h1>
        <p className="text-muted">{reqs.length} solicitações de contratação.</p>
      </div>

      {reqs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-20 text-center text-muted">
          <CalendarDays size={36} className="mx-auto mb-3 text-faint" />
          Nenhum pedido de evento ainda.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reqs.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg text-ink">{r.name}</h3>
                  {r.company && <p className="flex items-center gap-1 text-sm text-muted"><Building2 size={13} /> {r.company}</p>}
                </div>
                <span className="text-xs text-faint">{formatDateTime(r.created_at)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-muted">
                {r.event_type && <p className="flex items-center gap-1.5"><CalendarDays size={13} className="text-teal" /> {r.event_type}</p>}
                {r.city && <p className="flex items-center gap-1.5"><MapPin size={13} className="text-teal" /> {r.city}</p>}
                {r.event_date && <p className="flex items-center gap-1.5"><CalendarDays size={13} className="text-teal" /> {formatDate(r.event_date)}</p>}
                {r.phone && <p className="flex items-center gap-1.5"><Phone size={13} className="text-teal" /> {r.phone}</p>}
                {r.email && <p className="col-span-2 flex items-center gap-1.5"><Mail size={13} className="text-teal" /> {r.email}</p>}
              </div>

              {r.message && <p className="mt-3 rounded-lg bg-bg-soft p-3 text-sm text-muted">{r.message}</p>}

              {r.phone && (
                <a
                  href={whatsappLink(r.phone, `Olá ${r.name}! Recebemos seu pedido de evento na Neblina Records.`)}
                  target="_blank"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-teal/40 bg-teal/10 px-4 py-2 text-sm text-teal hover:bg-teal/15"
                >
                  <MessageCircle size={15} /> Responder no WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
