"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarClock, Tag, Sparkles, Trash2, Check, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import type { UserNotification, NotificationType } from "@/lib/types";

const META: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  event_presence: { icon: CalendarClock, color: "text-teal" },
  disc_promo: { icon: Tag, color: "text-brand" },
  weekly_promo: { icon: Sparkles, color: "text-brand" },
  custom: { icon: Bell, color: "text-muted" },
};

export default function NotificationsList({ userId, initial }: { userId: string; initial: UserNotification[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<UserNotification[]>(initial);

  // ao abrir a caixa, marca todas como lidas (o sino zera)
  useEffect(() => {
    const unread = initial.some((n) => !n.read_at);
    if (!unread) return;
    (async () => {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("user_id", userId).is("read_at", null);
      window.dispatchEvent(new Event("neblina:notifs-changed"));
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(id: string) {
    setItems((list) => list.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
    window.dispatchEvent(new Event("neblina:notifs-changed"));
  }

  async function clearAll() {
    if (!window.confirm("Limpar todas as notificações?")) return;
    setItems([]);
    await supabase.from("notifications").delete().eq("user_id", userId);
    window.dispatchEvent(new Event("neblina:notifs-changed"));
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-24 text-center text-muted">
        <Inbox size={40} className="mx-auto mb-3 text-faint" />
        <p className="text-lg">Sua caixa está vazia.</p>
        <p className="mt-1 text-sm text-faint">Novidades, promoções e presenças em eventos aparecem aqui.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={clearAll} className="text-xs text-faint hover:text-red-400">Limpar todas</button>
      </div>
      <ul className="space-y-2.5">
        {items.map((n) => {
          const meta = META[n.type] ?? META.custom;
          const Icon = meta.icon;
          const wasNew = !n.read_at;
          const inner = (
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-soft ${meta.color}`}>
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium text-ink">
                  {n.title}
                  {wasNew && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-black">Nova</span>}
                </p>
                {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                <p className="mt-1 text-[11px] text-faint">{formatDateTime(n.created_at)}</p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); remove(n.id); }}
                className="rounded-lg p-1.5 text-faint hover:bg-panel-2 hover:text-red-400"
                aria-label="Remover"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
          return (
            <li key={n.id} className={`rounded-2xl border p-3.5 transition ${wasNew ? "border-brand/40 bg-brand/10" : "border-line bg-panel"}`}>
              {n.link ? (
                <Link href={n.link} className="block hover:opacity-90">{inner}</Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-faint">
        <Check size={13} /> Tudo marcado como lido.
      </p>
    </div>
  );
}
