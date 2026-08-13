import type { RecordItem } from "@/lib/types";

/**
 * IDs das tags AINDA VÁLIDAS de um disco (esconde as que já expiraram).
 * `tag_expiries[tagId]` ausente = permanente; com data = some após a data.
 */
export function visibleTagIds(record: Pick<RecordItem, "tag_ids"> & { tag_expiries?: Record<string, string> | null }): string[] {
  const ids = record.tag_ids ?? [];
  const exp = record.tag_expiries ?? {};
  const now = Date.now();
  return ids.filter((id) => {
    const at = exp[id];
    return !at || new Date(at).getTime() > now;
  });
}
