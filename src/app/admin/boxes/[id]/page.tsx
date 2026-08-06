import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BoxForm from "@/components/admin/BoxForm";
import BoxDiscsManager, { type BoxDiscInit } from "@/components/admin/BoxDiscsManager";
import type { BoxItem } from "@/lib/types";

export const revalidate = 0;

export default async function EditBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: box }, { data: rows }] = await Promise.all([
    supabase.from("boxes").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("box_records")
      .select("position, records(id,title,artist,cover_image_url,audio_url)")
      .eq("box_id", id)
      .order("position"),
  ]);

  if (!box) notFound();

  const initialDiscs = ((rows ?? []) as unknown as { records: BoxDiscInit | null }[])
    .map((r) => r.records)
    .filter((r): r is BoxDiscInit => !!r);

  return (
    <div className="p-6 md:p-10">
      <Link href="/admin/boxes" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-6 font-display text-3xl text-ink">Editar box</h1>
      <BoxForm box={box as BoxItem} />
      <div className="mt-8">
        <BoxDiscsManager boxId={id} discs={initialDiscs} />
      </div>
    </div>
  );
}
