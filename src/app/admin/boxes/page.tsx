import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminBoxesTable from "@/components/admin/AdminBoxesTable";
import type { BoxSummary } from "@/lib/types";

export const revalidate = 0;

export default async function AdminBoxesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boxes")
    .select("*, box_records(count)")
    .order("created_at", { ascending: false });

  const boxes: BoxSummary[] = ((data ?? []) as unknown as (BoxSummary & { box_records?: { count: number }[] })[]).map((b) => ({
    ...b,
    disc_count: b.box_records?.[0]?.count ?? 0,
  }));

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Boxes</h1>
          <p className="text-muted">Caixas com vários discos vinculados.</p>
        </div>
        <Link href="/admin/boxes/novo" className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm">
          <Plus size={17} /> Novo box
        </Link>
      </div>

      <AdminBoxesTable boxes={boxes} />
    </div>
  );
}
