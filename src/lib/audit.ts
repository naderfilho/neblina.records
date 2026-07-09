"use client";

import { createClient } from "@/lib/supabase/client";

/** Registra uma ação do admin no histórico (auditoria). Nunca bloqueia a ação. */
export async function logAction(
  action: string,
  entity: string,
  entityId: string | null,
  entityLabel: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    await createClient().rpc("log_action", {
      p_action: action,
      p_entity: entity,
      p_entity_id: entityId,
      p_entity_label: entityLabel,
      p_details: details,
    });
  } catch {
    /* auditoria é best-effort */
  }
}
