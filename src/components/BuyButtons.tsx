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
  available?: boolean;
};

function WhatsAppGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.898 9.82 9.82 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413" />
    </svg>
  );
}

export default function BuyButtons({ id, title, artist, price, coverUrl, available = true }: Props) {
  const cart = useCart();
  const router = useRouter();
  const inCart = cart.has(id);

  if (!available) {
    return (
      <div className="rounded-xl border border-line bg-bg-soft px-4 py-3 text-sm text-muted">
        Este disco está <strong className="text-mist">indisponível</strong> no momento.
      </div>
    );
  }

  async function getName(): Promise<string | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/login?next=/disco/${id}`); return null; }
    const { data: profile } = await supabase
      .from("profiles").select("first_name,last_name").eq("id", user.id).maybeSingle();
    return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  }

  // melhor cupom válido do cliente (o RLS já devolve só os dele + gerais ativos)
  async function bestCoupon(): Promise<{ code: string; pct: number } | null> {
    const supabase = createClient();
    const { data } = await supabase.from("coupons").select("code,discount_percent,expires_at,is_active,redeemed_at");
    if (!data?.length) return null;
    const now = Date.now();
    const valid = data
      .filter((c) => c.is_active && !c.redeemed_at && (!c.expires_at || new Date(c.expires_at as string).getTime() > now))
      .sort((a, b) => (b.discount_percent as number) - (a.discount_percent as number));
    return valid.length ? { code: valid[0].code as string, pct: valid[0].discount_percent as number } : null;
  }

  function message(name: string, coupon: { code: string; pct: number } | null) {
    const hello = name ? `Me chamo ${name} e tenho` : "Tenho";
    // link SEMPRE no domínio próprio (nunca a URL da Vercel)
    const link = `${STORE.siteUrl}/disco/${id}`;
    const base = `Olá, Neblina Records! ${hello} interesse no seguinte disco:\n\n${title} — ${artist} — ${formatBRL(price)}\n${link}`;
    return coupon ? `${base}\n\nTenho o cupom ${coupon.code} (${coupon.pct}% de desconto).` : base;
  }

  async function buyWhatsApp() {
    const name = await getName();
    if (name === null) return; // não logado → redirecionado
    const coupon = await bestCoupon();
    window.open(whatsappLink(STORE.whatsappPrimary, message(name, coupon)), "_blank");
    cart.finalize(id); // comprou este disco pelo WhatsApp → não é abandono
  }

  return (
    <div className="space-y-3">
      <button
        onClick={buyWhatsApp}
        className="flex w-fit items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, #1faf54, #12924a)",
          boxShadow: "0 5px 14px -8px rgba(18,146,74,0.45)",
        }}
      >
        <WhatsAppGlyph size={16} />
        Comprar pelo WhatsApp
      </button>

      <button
        onClick={() => (inCart ? cart.setOpen(true) : cart.add({ id, title, artist, price, coverUrl }))}
        className={`flex w-fit items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
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
