"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * "Intenção de compra": quando um usuário logado adiciona um disco ao carrinho,
 * registramos a intenção. Se ele NÃO finalizar pelo WhatsApp (nem remover do
 * carrinho) dentro de ~10 min, a intenção aparece nas Notificações do admin
 * ("Fulano adicionou o disco X e não finalizou via whatsapp").
 *
 * Tudo aqui é best-effort: se o usuário não estiver logado, é no-op (não temos
 * como identificá-lo). Falhas de rede são silenciadas para nunca atrapalhar o
 * fluxo do carrinho.
 */

async function currentUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Registra (ou re-arma) a intenção ao adicionar o disco ao carrinho. */
export async function trackCartAdd(recordId: string): Promise<void> {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    const supabase = createClient();
    await supabase
      .from("cart_intents")
      .upsert(
        { user_id: uid, record_id: recordId, created_at: new Date().toISOString(), finalized_at: null },
        { onConflict: "user_id,record_id" },
      );
  } catch {
    /* silencioso */
  }
}

/** Remove a intenção quando o usuário tira o disco do carrinho. */
export async function untrackCartItem(recordId: string): Promise<void> {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    const supabase = createClient();
    await supabase.from("cart_intents").delete().eq("user_id", uid).eq("record_id", recordId);
  } catch {
    /* silencioso */
  }
}

/** Remove todas as intenções pendentes (ex.: "esvaziar carrinho"). */
export async function untrackAllPending(): Promise<void> {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    const supabase = createClient();
    await supabase.from("cart_intents").delete().eq("user_id", uid).is("finalized_at", null);
  } catch {
    /* silencioso */
  }
}

/** Marca uma intenção como finalizada (ex.: "Comprar pelo WhatsApp" de 1 disco). */
export async function finalizeCartItem(recordId: string): Promise<void> {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    const supabase = createClient();
    await supabase
      .from("cart_intents")
      .update({ finalized_at: new Date().toISOString() })
      .eq("user_id", uid)
      .eq("record_id", recordId);
  } catch {
    /* silencioso */
  }
}

/** Marca todas as intenções pendentes como finalizadas (checkout do carrinho). */
export async function finalizeAllPending(): Promise<void> {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    const supabase = createClient();
    await supabase
      .from("cart_intents")
      .update({ finalized_at: new Date().toISOString() })
      .eq("user_id", uid)
      .is("finalized_at", null);
  } catch {
    /* silencioso */
  }
}
