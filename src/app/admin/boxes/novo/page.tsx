import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRange } from "@/lib/fetchAllRange";
import BoxForm, { type RecordOption } from "@/components/admin/BoxForm";

export const revalidate = 0;

export default async function NovoBoxPage() {
  const supabase = await createClient();
  const allRecords = await fetchAllRange<RecordOption>((from, to) =>
    supabase.from("records").select("id,title,artist,cover_image_url").order("created_at", { ascending: false }).order("id").range(from, to),
  );

  return (
    <div className="p-6 md:p-10">
      <Link href="/admin/boxes" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-6 font-display text-3xl text-ink">Novo box</h1>
      <BoxForm allRecords={allRecords} />
    </div>
  );
}
