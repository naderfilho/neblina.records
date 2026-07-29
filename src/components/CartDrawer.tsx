"use client";

import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import { STORE } from "@/lib/constants";
import { formatBRL, whatsappLink } from "@/lib/utils";

export default function CartDrawer() {
  const cart = useCart();
  const router = useRouter();

  async function checkout() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      cart.setOpen(false);
      router.push("/login?next=/&checkout=1");
      return;
    }

    // nome do cliente (para a saudação da mensagem)
    const { data: profile } = await supabase
      .from("profiles").select("first_name,last_name").eq("id", user.id).maybeSingle();
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
    const hello = name ? `Me chamo ${name} e tenho` : "Tenho";

    const multi = cart.items.length > 1;
    const items = cart.items
      .map((i, idx) => {
        const link = `${STORE.siteUrl}/disco/${i.id}`;
        const head = multi ? `${idx + 1}) ` : "";
        return `${head}${i.title} — ${i.artist} — ${formatBRL(i.price)}\n${link}`;
      })
      .join("\n\n");
    const intro = `Olá, Neblina Records! ${hello} interesse ${multi ? "nos seguintes discos" : "no seguinte disco"}:`;
    const msg = `${intro}\n\n${items}${multi ? `\n\nTotal: ${formatBRL(cart.total)}` : ""}`;
    window.open(whatsappLink(STORE.whatsappPrimary, msg), "_blank");
    cart.finalize(); // finalizou pelo WhatsApp → tira todos da lista de abandono
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={() => cart.setOpen(false)}
        className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity ${
          cart.open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-[90] flex h-full w-full max-w-md flex-col border-l border-line bg-panel shadow-2xl transition-transform duration-300 ${
          cart.open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="flex items-center gap-2 font-display text-lg text-ink">
            <ShoppingBag size={18} className="text-brand" /> Seu carrinho
          </h3>
          <button onClick={() => cart.setOpen(false)} className="rounded-lg p-1 text-muted hover:bg-panel-2 hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.items.length === 0 ? (
            <div className="mt-20 text-center text-muted">
              <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
              <p>Seu carrinho está vazio.</p>
              <p className="mt-1 text-sm text-faint">Passe o mouse nos discos e adicione seus favoritos.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft p-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full border border-line bg-black">
                    {i.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.coverUrl} alt={i.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p translate="no" className="notranslate truncate font-medium text-ink">{i.title}</p>
                    <p translate="no" className="notranslate truncate text-sm text-muted">{i.artist}</p>
                    <p className="text-sm font-semibold text-brand">{formatBRL(i.price)}</p>
                  </div>
                  <button
                    onClick={() => cart.remove(i.id)}
                    className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-red-400"
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-muted">Total</span>
              <span className="font-display text-2xl text-brand">{formatBRL(cart.total)}</span>
            </div>
            <button
              onClick={checkout}
              className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm"
            >
              <MessageCircle size={18} /> Finalizar no WhatsApp
            </button>
            <p className="mt-2 text-center text-xs text-faint">
              É necessário ter cadastro para finalizar o pedido.
            </p>
            <button onClick={cart.clear} className="mt-2 w-full text-center text-xs text-faint hover:text-muted">
              Esvaziar carrinho
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
