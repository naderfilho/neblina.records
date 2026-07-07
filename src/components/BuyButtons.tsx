"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import { STORE } from "@/lib/constants";
import { formatBRL, whatsappLink } from "@/lib/utils";

type Props = {
  id: string;
  title: string;
  artist: string;
  price: number;
  coverUrl?: string | null;
};

export default function BuyButtons({ id, title, artist, price, coverUrl }: Props) {
  const cart = useCart();
  const router = useRouter();
  const inCart = cart.has(id);

  async function ensureAuth(): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/disco/${id}`);
      return false;
    }
    return true;
  }

  function message() {
    return `Olá, Neblina Records! Tenho interesse no disco:\n\n*${title}* — ${artist}\nValor: ${formatBRL(
      price,
    )}\n\nLink: ${typeof window !== "undefined" ? window.location.href : ""}`;
  }

  async function buyWhatsApp() {
    if (!(await ensureAuth())) return;
    window.open(whatsappLink(STORE.whatsappPrimary, message()), "_blank");
  }

  async function buyTelegram() {
    if (!(await ensureAuth())) return;
    const url = `https://t.me/${STORE.telegram}?text=${encodeURIComponent(message())}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={buyWhatsApp}
          className="btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm"
        >
          <span className="text-lg leading-none">🇧🇷</span> Comprar pelo WhatsApp
        </button>
        <button
          onClick={buyTelegram}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(180deg,#2fb7ee,#229ED9)", boxShadow: "0 10px 30px -8px rgba(34,158,217,.5)" }}
        >
          <span className="text-lg leading-none">🌐</span> Comprar pelo Telegram
        </button>
      </div>

      <button
        onClick={() => (inCart ? cart.setOpen(true) : cart.add({ id, title, artist, price, coverUrl }))}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
          inCart
            ? "border-teal/60 bg-teal/15 text-teal"
            : "border-line bg-panel text-muted hover:border-brand/50 hover:text-ink"
        }`}
      >
        {inCart ? <Check size={14} /> : <ShoppingBag size={14} />}
        {inCart ? "No carrinho" : "Adicionar ao carrinho"}
      </button>
    </div>
  );
}
