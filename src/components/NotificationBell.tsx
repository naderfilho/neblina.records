"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Sino no cabeçalho: mostra quantas notificações o usuário ainda não leu. */
export default function NotificationBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { count: c } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    setCount(c ?? 0);
  }, [userId]);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    const onChanged = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("neblina:notifs-changed", onChanged);
    const t = window.setInterval(refresh, 60000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("neblina:notifs-changed", onChanged);
      window.clearInterval(t);
    };
  }, [refresh]);

  return (
    <Link
      href="/notificacoes"
      className="relative rounded-xl p-2.5 text-ink transition-colors hover:bg-panel"
      aria-label={count > 0 ? `${count} notificações não lidas` : "Notificações"}
    >
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-black">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
