import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import Audioteca, { type BoxAudio } from "@/components/Audioteca";
import type { RecordItem } from "@/lib/types";

const AUDIO_REC_COLS =
  "id,title,artist,cover_image_url,cover_image_url_b,disc_config,tracks,audio_url,audio_start,audio_end,is_gatefold,gatefold_image_url,gatefold_dir,audioteca_tier";

export const revalidate = 0;

export const metadata = {
  title: "Audioteca",
  description: "Pegue um disco da prateleira, coloque no toca-discos e ouça. A experiência do vinil, dentro do site.",
};

export default async function AudiotecaPage() {
  const supabase = await createClient();
  const [{ data }, { data: boxData }, { profile }] = await Promise.all([
    supabase
      .from("records")
      .select(AUDIO_REC_COLS)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("boxes")
      .select(`id,title,cover_image_url,spine_image_url,box_config,audioteca_tier,box_records(position,records(${AUDIO_REC_COLS}))`)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    getSessionProfile(),
  ]);

  // Regra: só aparecem na Audioteca discos com pelo menos uma faixa COM áudio.
  // (discos sem faixas, ou com faixas ainda sem áudio, ficam de fora)
  const hasAudio = (r: RecordItem) => Array.isArray(r.tracks) && r.tracks.some((t) => t.audio_url);
  const records = ((data ?? []) as RecordItem[]).filter(hasAudio);

  // boxes: monta a lista de discos (ordenada) que têm áudio. Só entra na
  // Audioteca o box que tiver pelo menos um disco tocável.
  const boxes: BoxAudio[] = ((boxData ?? []) as unknown as {
    id: string; title: string; cover_image_url: string | null; spine_image_url: string | null;
    box_config: BoxAudio["box_config"]; audioteca_tier: string;
    box_records: { position: number; records: RecordItem | null }[];
  }[])
    .map((b) => ({
      id: b.id,
      title: b.title,
      cover_image_url: b.cover_image_url,
      spine_image_url: b.spine_image_url,
      box_config: b.box_config,
      audioteca_tier: b.audioteca_tier,
      records: [...(b.box_records ?? [])]
        .sort((x, y) => x.position - y.position)
        .map((br) => br.records)
        .filter((r): r is RecordItem => !!r && hasAudio(r)),
    }))
    .filter((b) => b.records.length > 0);

  const isLoggedIn = !!profile;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal">Audioteca</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-ink md:text-5xl">O toca-discos da Neblina</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Pegue um disco da prateleira e leve até o prato com as próprias mãos. Solte, deixe a agulha descer e ouça.
        </p>
      </div>

      <Audioteca records={records} boxes={boxes} isLoggedIn={isLoggedIn} />
    </div>
  );
}
