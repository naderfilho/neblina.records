import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminRecordsTable from "@/components/admin/AdminRecordsTable";
import type { RecordItem, Tag } from "@/lib/types";

export const revalidate = 0;

// Colunas usadas pela tabela do admin (sem os campos pesados: tracks, history…).
const TABLE_COLS = "id,title,artist,genre,year,price,availability,views_count,is_published,cover_image_url,tag_ids";

/** Busca TODOS os discos paginando por `range` (o PostgREST corta em 1000). */
async function fetchAllRecords(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<RecordItem[]> {
  const all: RecordItem[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("records")
      .select(TABLE_COLS)
      .eq("box_only", false) // discos exclusivos de box não entram no catálogo
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error || !data?.length) break;
    all.push(...(data as unknown as RecordItem[]));
    if (data.length < 1000) break;
  }
  return all;
}

export default async function AdminDiscosPage() {
  const supabase = await createClient();
  const [data, { data: tagData }] = await Promise.all([
    fetchAllRecords(supabase),
    supabase.from("tags").select("*").order("created_at"),
  ]);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Discos</h1>
          <p className="text-muted">Gerencie todo o acervo.</p>
        </div>
        <Link href="/admin/discos/novo" className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm">
          <Plus size={17} /> Novo disco
        </Link>
      </div>

      <AdminRecordsTable records={(data as RecordItem[]) ?? []} tags={(tagData as Tag[]) ?? []} />
    </div>
  );
}
