import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRange } from "@/lib/fetchAllRange";
import RecordForm from "@/components/admin/RecordForm";
import type { RecordItem, RecordPhoto } from "@/lib/types";

export const revalidate = 0;

type Suggestion = { genre: string | null; nationality: string | null; artist: string | null };
function uniq(arr: (string | null)[]) {
  return Array.from(new Set(arr.filter((v): v is string => !!v))).sort();
}

export default async function EditBoxDiscoPage({ params }: { params: Promise<{ id: string; discId: string }> }) {
  const { id, discId } = await params;
  const supabase = await createClient();

  const [{ data: box }, { data: rec }, { data: photos }] = await Promise.all([
    supabase.from("boxes").select("id,title").eq("id", id).maybeSingle(),
    supabase.from("records").select("*").eq("id", discId).maybeSingle(),
    supabase.from("record_photos").select("*").eq("record_id", discId).order("sort_order"),
  ]);
  if (!box || !rec) notFound();

  const rows = await fetchAllRange<Suggestion>((from, to) =>
    supabase.from("records").select("genre,nationality,artist").order("id").range(from, to),
  );

  return (
    <div className="p-6 md:p-10">
      <Link href={`/admin/boxes/${id}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao box
      </Link>
      <h1 className="mb-2 font-display text-3xl text-ink">Editar disco do box</h1>
      <p className="mb-6 text-sm text-muted">
        <span className="font-medium text-ink">“{(box as { title: string }).title}”</span>
      </p>
      <RecordForm
        boxId={id}
        record={rec as RecordItem}
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
