import Link from "next/link";
import { Plus, Disc3, Pencil, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminRecordsTable from "@/components/admin/AdminRecordsTable";
import { cn } from "@/lib/utils";
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

type BoxDiscRow = {
  position: number;
  box_id: string;
  boxes: { id: string; title: string } | null;
  records: { id: string; title: string; artist: string; cover_image_url: string | null } | null;
};

function Tabs({ active }: { active: "acervo" | "boxes" }) {
  const base = "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors";
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Link href="/admin/discos" className={cn(base, active === "acervo" ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
        <Disc3 size={15} /> Acervo
      </Link>
      <Link href="/admin/discos?tab=boxes" className={cn(base, active === "boxes" ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
        <Package size={15} /> Discos de boxes
      </Link>
    </div>
  );
}

export default async function AdminDiscosPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();

  // ---- Aba "Discos de boxes" (registros box_only, agrupados pelo box) ----
  if (tab === "boxes") {
    const { data: rowsRaw } = await supabase
      .from("box_records")
      .select("position, box_id, boxes(id,title), records(id,title,artist,cover_image_url)")
      .order("position");
    const rows = (rowsRaw ?? []) as unknown as BoxDiscRow[];

    // agrupa por box, preservando a ordem (position)
    const groups = new Map<string, { title: string; discs: BoxDiscRow[] }>();
    for (const r of rows) {
      if (!r.boxes || !r.records) continue;
      const g = groups.get(r.box_id) ?? { title: r.boxes.title, discs: [] };
      g.discs.push(r);
      groups.set(r.box_id, g);
    }
    const boxes = [...groups.entries()].sort((a, b) => a[1].title.localeCompare(b[1].title));

    return (
      <div className="p-6 md:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-ink">Discos</h1>
            <p className="text-muted">Discos exclusivos de boxes (não aparecem no catálogo nem são vendidos soltos).</p>
          </div>
          <Link href="/admin/boxes" className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm">
            <Package size={17} /> Gerenciar boxes
          </Link>
        </div>
        <Tabs active="boxes" />

        {boxes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line py-12 text-center text-muted">
            Nenhum disco de box ainda. Crie um box e adicione discos a ele.
          </p>
        ) : (
          <div className="space-y-6">
            {boxes.map(([boxId, g]) => (
              <div key={boxId} className="rounded-2xl border border-line bg-panel p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-display text-lg text-ink">
                    <Package size={16} className="text-brand" /> {g.title}
                    <span className="text-sm font-normal text-faint">({g.discs.length})</span>
                  </h2>
                  <Link href={`/admin/boxes/${boxId}`} className="text-sm text-muted hover:text-brand">Abrir box</Link>
                </div>
                <div className="space-y-2">
                  {g.discs.map((r) => (
                    <div key={r.records!.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft p-2.5">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-panel">
                        {r.records!.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.records!.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-faint"><Disc3 size={16} /></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{r.records!.title || "Sem título"}</p>
                        <p className="truncate text-xs text-muted">{r.records!.artist}</p>
                      </div>
                      <Link href={`/admin/boxes/${boxId}/discos/${r.records!.id}`} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-brand/50 hover:text-brand">
                        <Pencil size={13} /> Editar
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Aba "Acervo" (catálogo normal) ----
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
      <Tabs active="acervo" />

      <AdminRecordsTable records={(data as RecordItem[]) ?? []} tags={(tagData as Tag[]) ?? []} />
    </div>
  );
}
