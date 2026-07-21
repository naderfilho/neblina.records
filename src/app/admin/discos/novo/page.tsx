import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRange } from "@/lib/fetchAllRange";
import RecordForm from "@/components/admin/RecordForm";
import type { RecordItem, RecordPhoto } from "@/lib/types";

export const revalidate = 0;

type Suggestion = { genre: string | null; nationality: string | null; artist: string | null };

function uniq(arr: (string | null)[]) {
  return Array.from(new Set(arr.filter((v): v is string => !!v))).sort();
}

export default async function NovoDiscoPage({
  searchParams,
}: {
  searchParams: Promise<{ clone?: string }>;
}) {
  const { clone: cloneId } = await searchParams;
  const supabase = await createClient();
  // sugestões (estilo/nacionalidade/artista) de TODO o acervo, não só dos 1000 primeiros
  const rows = await fetchAllRange<Suggestion>((from, to) =>
    supabase.from("records").select("genre,nationality,artist").order("id").range(from, to),
  );

  // "Clonar disco": carrega o disco de origem só para PREENCHER o formulário.
  // O original não é tocado — o form fica em modo de criação (prop `clone`).
  let cloneSource: RecordItem | undefined;
  let clonePhotos: RecordPhoto[] = [];
  if (cloneId) {
    const [{ data: src }, { data: photos }] = await Promise.all([
      supabase.from("records").select("*").eq("id", cloneId).maybeSingle(),
      supabase.from("record_photos").select("*").eq("record_id", cloneId).order("sort_order"),
    ]);
    if (src) {
      cloneSource = {
        ...(src as RecordItem),
        // o clone é um disco NOVO: não herda a venda do original (essa parte
        // descreve a transação daquela cópia específica, não o catálogo)
        availability: "available",
        sold: false,
        sold_channel: null,
        sold_to_user_id: null,
        sold_to_name: null,
        sold_at: null,
        sold_note: null,
        sort_order: 0,
      };
      clonePhotos = (photos as RecordPhoto[]) ?? [];
    }
  }

  return (
    <div className="p-6 md:p-10">
      <Link href="/admin/discos" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-2 font-display text-3xl text-ink">{cloneSource ? "Clonar disco" : "Novo disco"}</h1>
      {cloneSource && (
        <p className="mb-6 flex items-center gap-2 text-sm text-muted">
          <Copy size={14} className="text-brand" />
          Cópia de <span className="font-medium text-ink">“{cloneSource.title}”</span> — ajuste o que quiser e publique. O disco original não é alterado.
        </p>
      )}
      <RecordForm
        record={cloneSource}
        existingPhotos={clonePhotos}
        clone={!!cloneSource}
        suggestions={{
          genres: uniq(rows.map((r) => r.genre)),
          nationalities: uniq(rows.map((r) => r.nationality)),
          artists: uniq(rows.map((r) => r.artist)),
        }}
      />
    </div>
  );
}
