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

function WhatsAppGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.898 9.82 9.82 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413" />
    </svg>
  );
}

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

  return (
    <div className="space-y-3">
      <button
        onClick={buyWhatsApp}
        className="inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, #1faf54, #12924a)",
          boxShadow: "0 6px 16px -8px rgba(18,146,74,0.5)",
        }}
      >
        <WhatsAppGlyph size={18} />
        Comprar pelo WhatsApp
      </button>

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
