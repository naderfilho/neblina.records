"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Disc3, Users, CalendarDays, Store, LogOut, Tag, ArrowUpDown, Music, Headphones, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/discos", label: "Discos", icon: Disc3 },
  { href: "/admin/musica-home", label: "Música da home", icon: Music },
  { href: "/admin/audioteca", label: "Audioteca", icon: Headphones },
  { href: "/admin/ordenar", label: "Ordenar", icon: ArrowUpDown },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/historico", label: "Histórico", icon: History },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-full shrink-0 border-b border-line bg-bg-soft md:sticky md:top-0 md:h-screen md:w-64 md:self-start md:overflow-y-auto md:border-b-0 md:border-r">
      <div>
        <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
          <Image src="/logo.png" alt="Neblina" width={40} height={40} className="h-10 w-10 object-contain" />
          <div className="leading-none">
            <p className="font-display text-lg text-brand">NEBLINA</p>
            <p className="text-[10px] tracking-widest text-muted">ADMIN</p>
          </div>
        </Link>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                  active ? "bg-brand/15 text-brand" : "text-muted hover:bg-panel hover:text-ink",
                )}
              >
                <l.icon size={17} /> {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden px-3 md:mt-4 md:block">
          <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-muted hover:bg-panel hover:text-ink">
            <Store size={17} /> Voltar para a loja
          </Link>
          <button onClick={signOut} className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-muted hover:bg-panel hover:text-red-400">
            <LogOut size={17} /> Finalizar sessão
          </button>
        </div>
      </div>
    </aside>
  );
}
