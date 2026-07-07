import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import RecordForm from "@/components/admin/RecordForm";
import type { RecordItem, RecordPhoto } from "@/lib/types";

export const revalidate = 0;

function uniq(arr: (string | null)[]) {
  return Array.from(new Set(arr.filter((v): v is string => !!v))).sort();
}

export default async function EditarDiscoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: record }, { data: photos }, { data: all }] = await Promise.all([
    supabase.from("records").select("*").eq("id", id).single(),
    supabase.from("record_photos").select("*").eq("record_id", id).order("sort_order"),
    supabase.from("records").select("genre,nationality,artist"),
  ]);

  if (!record) notFound();
  const rows = all ?? [];

  return (
    <div className="p-6 md:p-10">
      <Link href="/admin/discos" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-6 font-display text-3xl text-ink">Editar disco</h1>
      <RecordForm
        record={record as RecordItem}
        existingPhotos={(photos as RecordPhoto[]) ?? []}
        suggestions={{
          genres: uniq(rows.map((r) => r.genre)),
          nationalities: uniq(rows.map((r) => r.nationality)),
          artists: uniq(rows.map((r) => r.artist)),
        }}
      />
    </div>
  );
}
