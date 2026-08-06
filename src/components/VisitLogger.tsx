"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Registra 1 acesso por página vista (page view) via RPC log_site_visit.
 * Sem dado pessoal — só o caminho e a hora. Fica no layout público, então
 * páginas do /admin não contam.
 */
export default function VisitLogger() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    createClient().rpc("log_site_visit", { p_path: pathname }).then(() => {}, () => {});
  }, [pathname]);

  return null;
}
