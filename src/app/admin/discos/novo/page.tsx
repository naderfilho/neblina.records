import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import RecordForm from "@/components/admin/RecordForm";

export const revalidate = 0;

function uniq(arr: (string | null)[]) {
  return Array.from(new Set(arr.filter((v): v is string => !!v))).sort();
}

export default async function NovoDiscoPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("records").select("genre,nationality,artist");
  const rows = data ?? [];

  return (
    <div className="p-6 md:p-10">
      <Link href="/admin/discos" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-6 font-display text-3xl text-ink">Novo disco</h1>
      <RecordForm
        suggestions={{
          genres: uniq(rows.map((r) => r.genre)),
          nationalities: uniq(rows.map((r) => r.nationality)),
          artists: uniq(rows.map((r) => r.artist)),
        }}
      />
    </div>
  );
}
