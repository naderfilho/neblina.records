import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminRecordsTable from "@/components/admin/AdminRecordsTable";
import type { RecordItem } from "@/lib/types";

export const revalidate = 0;

export default async function AdminDiscosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("records").select("*").order("created_at", { ascending: false });

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

      <AdminRecordsTable records={(data as RecordItem[]) ?? []} />
    </div>
  );
}
