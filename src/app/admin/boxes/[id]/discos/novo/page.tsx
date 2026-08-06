import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRange } from "@/lib/fetchAllRange";
import RecordForm from "@/components/admin/RecordForm";

export const revalidate = 0;

type Suggestion = { genre: string | null; nationality: string | null; artist: string | null };
function uniq(arr: (string | null)[]) {
  return Array.from(new Set(arr.filter((v): v is string => !!v))).sort();
}

export default async function NovoBoxDiscoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: box } = await supabase.from("boxes").select("id,title").eq("id", id).maybeSingle();
  if (!box) notFound();

  const rows = await fetchAllRange<Suggestion>((from, to) =>
    supabase.from("records").select("genre,nationality,artist").order("id").range(from, to),
  );

  return (
    <div className="p-6 md:p-10">
      <Link href={`/admin/boxes/${id}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao box
      </Link>
      <h1 className="mb-2 font-display text-3xl text-ink">Novo disco do box</h1>
      <p className="mb-6 text-sm text-muted">
        <span className="font-medium text-ink">“{(box as { title: string }).title}”</span> — cadastro completo. O disco fica exclusivo deste box.
      </p>
      <RecordForm
        boxId={id}
        suggestions={{
          genres: uniq(rows.map((r) => r.genre)),
          nationalities: uniq(rows.map((r) => r.nationality)),
          artists: uniq(rows.map((r) => r.artist)),
        }}
      />
    </div>
  );
}
