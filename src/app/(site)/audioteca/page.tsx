import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import Audioteca from "@/components/Audioteca";
import type { RecordItem } from "@/lib/types";

export const revalidate = 0;

export const metadata = {
  title: "Audioteca",
  description: "Pegue um disco da prateleira, coloque no toca-discos e ouça. A experiência do vinil, dentro do site.",
};

export default async function AudiotecaPage() {
  const supabase = await createClient();
  const [{ data }, { profile }] = await Promise.all([
    supabase
      .from("records")
      .select("id,title,artist,cover_image_url,disc_config,tracks,audio_url,audio_start,audio_end,is_gatefold,gatefold_image_url,gatefold_dir,audioteca_tier")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    getSessionProfile(),
  ]);

  // Regra: só aparecem na Audioteca discos com pelo menos uma faixa COM áudio.
  // (discos sem faixas, ou com faixas ainda sem áudio, ficam de fora)
  const records = ((data ?? []) as RecordItem[]).filter(
    (r) => Array.isArray(r.tracks) && r.tracks.some((t) => t.audio_url),
  );
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

      <Audioteca records={records} isLoggedIn={isLoggedIn} />
    </div>
  );
}
