import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRange } from "@/lib/fetchAllRange";
import BoxForm, { type RecordOption } from "@/components/admin/BoxForm";
import type { BoxItem } from "@/lib/types";

export const revalidate = 0;

export default async function EditBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: box }, { data: rows }, allRecords] = await Promise.all([
    supabase.from("boxes").select("*").eq("id", id).maybeSingle(),
    supabase.from("box_records").select("record_id, position").eq("box_id", id).order("position"),
    fetchAllRange<RecordOption>((from, to) =>
      supabase.from("records").select("id,title,artist,cover_image_url").order("created_at", { ascending: false }).order("id").range(from, to),
    ),
  ]);

  if (!box) notFound();
  const initialRecordIds = ((rows ?? []) as { record_id: string }[]).map((r) => r.record_id);

  return (
    <div className="p-6 md:p-10">
      <Link href="/admin/boxes" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-6 font-display text-3xl text-ink">Editar box</h1>
      <BoxForm box={box as BoxItem} initialRecordIds={initialRecordIds} allRecords={allRecords} />
    </div>
  );
}
