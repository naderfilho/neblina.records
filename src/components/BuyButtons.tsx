"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, Check, MessageCircle } from "lucide-react";
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

  async function buyNow() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/disco/${id}`);
      return;
    }
    const msg = `Olá, Neblina Records! Tenho interesse no disco:\n\n*${title}* — ${artist}\nValor: ${formatBRL(
      price,
    )}\n\nLink: ${window.location.href}`;
    window.open(whatsappLink(STORE.whatsappPrimary, msg), "_blank");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button onClick={buyNow} className="btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm">
        <MessageCircle size={18} /> Comprar via WhatsApp
      </button>
      <button
        onClick={() =>
          inCart ? cart.setOpen(true) : cart.add({ id, title, artist, price, coverUrl })
        }
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm transition-colors ${
          inCart
            ? "border-teal/60 bg-teal/15 text-teal"
            : "border-line bg-panel text-ink hover:border-brand/50"
        }`}
      >
        {inCart ? <Check size={18} /> : <ShoppingBag size={18} />}
        {inCart ? "No carrinho" : "Adicionar ao carrinho"}
      </button>
    </div>
  );
}
