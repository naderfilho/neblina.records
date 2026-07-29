"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Dot } from "lucide-react";
import type { StoreEvent } from "@/lib/types";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** todos os dias (YYYY-MM-DD) que o evento cobre, do início ao fim */
function daysOfEvent(e: StoreEvent): string[] {
  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : start;
  const out: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) { out.push(keyOf(cur)); cur.setDate(cur.getDate() + 1); }
  return out;
}

function fmtRange(e: StoreEvent): string {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" };
  const s = new Date(e.starts_at).toLocaleString("pt-BR", opts);
  if (!e.ends_at) return s;
  const end = new Date(e.ends_at);
  const sameDay = new Date(e.starts_at).toDateString() === end.toDateString();
  return `${s} — ${end.toLocaleString("pt-BR", sameDay ? { hour: "2-digit", minute: "2-digit" } : opts)}`;
}

export default function EventsCalendar({ events }: { events: StoreEvent[] }) {
  // "agora"/"hoje" calculados uma vez na montagem (não precisam atualizar ao vivo)
  const [nowMs] = useState(() => Date.now());
  const [todayKey] = useState(() => keyOf(new Date()));

  // mapa dia -> eventos
  const byDay = useMemo(() => {
    const m = new Map<string, StoreEvent[]>();
    for (const e of events) for (const d of daysOfEvent(e)) (m.get(d) ?? m.set(d, []).get(d)!).push(e);
    return m;
  }, [events]);

  const upcoming = useMemo(
    () => [...events]
      .filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() >= nowMs - 12 * 3600 * 1000)
      .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)),
    [events, nowMs],
  );

  // começa no mês do próximo evento (ou no mês atual)
  const first = new Date(upcoming[0]?.starts_at ?? nowMs);
  const [view, setView] = useState({ y: first.getFullYear(), m: first.getMonth() });
  const [selected, setSelected] = useState<string | null>(upcoming[0] ? keyOf(new Date(upcoming[0].starts_at)) : null);

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEvents = selected ? byDay.get(selected) ?? [] : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* calendário */}
      <div className="rounded-3xl border border-line bg-panel/60 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-ink">
            {MONTHS[view.m]} <span className="text-muted">{view.y}</span>
          </h3>
          <div className="flex gap-1.5">
            <button
              onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
              className="rounded-xl border border-line p-2 text-muted transition hover:border-brand/50 hover:text-brand" aria-label="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setView({ y: new Date().getFullYear(), m: new Date().getMonth() })}
              className="rounded-xl border border-line px-3 text-xs text-muted transition hover:border-brand/50 hover:text-brand"
            >
              Hoje
            </button>
            <button
              onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
              className="rounded-xl border border-line p-2 text-muted transition hover:border-brand/50 hover:text-brand" aria-label="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEK.map((w, i) => (
            <div key={i} className="pb-1 text-center text-[11px] font-medium uppercase tracking-wider text-faint">{w}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />;
            const k = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const has = byDay.has(k);
            const isToday = k === todayKey;
            const isSel = k === selected;
            return (
              <button
                key={k}
                onClick={() => has && setSelected(k)}
                disabled={!has}
                className={[
                  "relative flex aspect-square items-center justify-center rounded-xl text-sm transition",
                  isSel ? "bg-brand font-bold text-black"
                    : has ? "bg-brand/12 font-semibold text-brand hover:bg-brand/20 cursor-pointer"
                    : "text-muted",
                  !isSel && isToday ? "ring-1 ring-inset ring-brand/50" : "",
                ].join(" ")}
              >
                {day}
                {has && !isSel && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand" />}
              </button>
            );
          })}
        </div>

        {/* eventos do dia selecionado */}
        {selectedEvents.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-line pt-4">
            {selectedEvents.map((e) => (
              <EventLine key={e.id} e={e} />
            ))}
          </div>
        )}
      </div>

      {/* próximos eventos */}
      <div className="rounded-3xl border border-line bg-panel/60 p-5 backdrop-blur-sm">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-teal">
          <CalendarDays size={15} /> Próximos eventos
        </p>
        {upcoming.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">
            <Dot className="mx-auto text-faint" />
            Nenhuma data marcada por enquanto. Fique de olho — em breve teremos novidades.
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcoming.slice(0, 8).map((e) => {
              const d = new Date(e.starts_at);
              return (
                <button
                  key={e.id}
                  onClick={() => { setView({ y: d.getFullYear(), m: d.getMonth() }); setSelected(keyOf(d)); }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-bg-soft p-3 text-left transition hover:border-brand/50"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand/15 text-brand">
                    <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                    <span className="text-[9px] uppercase">{MONTHS[d.getMonth()].slice(0, 3)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{e.title}</p>
                    {e.location && <p className="flex items-center gap-1 truncate text-xs text-muted"><MapPin size={11} /> {e.location}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EventLine({ e }: { e: StoreEvent }) {
  return (
    <div className="rounded-2xl bg-bg-soft p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-ink">{e.title}</p>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1"><CalendarDays size={12} className="text-teal" /> {fmtRange(e)}</span>
        {e.location && <span className="flex items-center gap-1"><MapPin size={12} className="text-teal" /> {e.location}</span>}
      </p>
      {e.description && <p className="mt-1.5 text-sm text-muted">{e.description}</p>}
    </div>
  );
}
