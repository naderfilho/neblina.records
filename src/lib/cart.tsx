"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  trackCartAdd,
  untrackCartItem,
  untrackAllPending,
  finalizeCartItem,
  finalizeAllPending,
} from "@/lib/cart-intents";

export type CartItem = {
  id: string;
  title: string;
  artist: string;
  price: number;
  coverUrl?: string | null;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  /** marca como finalizado (checkout). Sem id = todos os itens pendentes. */
  finalize: (id?: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "neblina_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => {
    return {
      items,
      count: items.length,
      total: items.reduce((s, i) => s + (i.price || 0), 0),
      add: (item) =>
        setItems((prev) => {
          if (prev.some((p) => p.id === item.id)) return prev;
          void trackCartAdd(item.id); // registra intenção (best-effort, só se logado)
          return [...prev, item];
        }),
      remove: (id) =>
        setItems((prev) => {
          void untrackCartItem(id); // tirou do carrinho → não é abandono
          return prev.filter((p) => p.id !== id);
        }),
      clear: () => {
        void untrackAllPending();
        setItems([]);
      },
      has: (id) => items.some((p) => p.id === id),
      finalize: (id) => {
        if (id) void finalizeCartItem(id);
        else void finalizeAllPending();
      },
      open,
      setOpen,
    };
  }, [items, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return c;
}
