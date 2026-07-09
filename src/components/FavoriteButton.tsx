"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function FavoriteButton({ recordId, initialFav, userId }: { recordId: string; initialFav: boolean; userId: string | null }) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFav);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!userId) {
      router.push(`/login?next=/disco/${recordId}`);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    if (fav) {
      await supabase.from("favorites").delete().eq("record_id", recordId).eq("user_id", userId);
      setFav(false);
    } else {
      await supabase.from("favorites").insert({ record_id: recordId, user_id: userId });
      setFav(true);
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
      className={cn(
        "flex w-fit items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors disabled:opacity-60",
        fav ? "border-red-400/50 bg-red-500/10 text-red-300" : "border-line bg-panel text-muted hover:border-red-400/50 hover:text-red-300",
      )}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} className={fav ? "fill-current" : ""} />}
      {fav ? "Favoritado" : "Favoritar"}
    </button>
  );
}
