"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShoppingBag, User, LogOut, LayoutDashboard, ChevronDown, Menu, X } from "lucide-react";
import TranslateButton from "@/components/TranslateButton";
import NotificationBell from "@/components/NotificationBell";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#acervo", label: "Discos" },
  { href: "/audioteca", label: "Audioteca" },
  { href: "/eventos", label: "Eventos" },
  { href: "/vender", label: "Venda seu disco" },
  { href: "/sobre", label: "Sobre" },
];

export default function SiteHeader({ profile }: { profile: Profile | null }) {
  const cart = useCart();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenu(false);
    router.push("/");
    router.refresh();
  }

  const firstName = profile?.first_name || "Conta";

  return (
    <header
      className={cn(
        "sticky top-0 z-[70] transition-all duration-300",
        scrolled ? "glass shadow-lg" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Neblina Records" width={60} height={60} className="h-14 w-14 object-contain md:h-16 md:w-16" priority />
          <div className="leading-none">
            <p className="font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">NEBLINA</p>
            <p className="text-xs font-medium tracking-[0.3em] text-muted sm:text-sm">Records</p>
          </div>
        </Link>

        {/* nav desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) =>
            n.href.includes("#") ? (
              <a key={n.href} href={n.href} className="text-sm font-medium text-muted transition-colors hover:text-brand">
                {n.label}
              </a>
            ) : (
              <Link key={n.href} href={n.href} className="text-sm font-medium text-muted transition-colors hover:text-brand">
                {n.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <TranslateButton />
          {profile && <NotificationBell userId={profile.id} />}
          <button
            onClick={() => cart.setOpen(true)}
            className="relative rounded-xl p-2.5 text-ink transition-colors hover:bg-panel"
            aria-label="Carrinho"
          >
            <ShoppingBag size={20} />
            {cart.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-black">
                {cart.count}
              </span>
            )}
          </button>

          {profile ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink hover:border-brand/50"
              >
                <User size={16} className="text-brand" />
                <span className="hidden max-w-[90px] truncate sm:inline">{firstName}</span>
                <ChevronDown size={14} className="text-muted" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
                  {profile.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm text-brand hover:bg-panel-2"
                    >
                      <LayoutDashboard size={16} /> Painel Admin
                    </Link>
                  )}
                  <Link
                    href="/conta"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-ink hover:bg-panel-2"
                  >
                    <User size={16} /> Minha conta
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 border-t border-line px-4 py-3 text-sm text-muted hover:bg-panel-2 hover:text-red-400"
                  >
                    <LogOut size={16} /> Finalizar sessão
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-ink hover:text-brand">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-brand rounded-xl px-4 py-2 text-sm">
                Cadastrar
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobile((v) => !v)}
            className="rounded-xl p-2.5 text-ink hover:bg-panel md:hidden"
            aria-label="Menu"
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* nav mobile */}
      {mobile && (
        <div className="border-t border-line bg-panel px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) =>
              n.href.includes("#") ? (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobile(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-panel-2"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobile(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-panel-2"
                >
                  {n.label}
                </Link>
              ),
            )}
            {!profile && (
              <div className="mt-2 flex gap-2">
                <Link href="/login" onClick={() => setMobile(false)} className="flex-1 rounded-lg border border-line px-3 py-2.5 text-center text-sm">
                  Entrar
                </Link>
                <Link href="/cadastro" onClick={() => setMobile(false)} className="btn-brand flex-1 rounded-lg px-3 py-2.5 text-center text-sm">
                  Cadastrar
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
