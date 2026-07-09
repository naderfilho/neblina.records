"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";

export default function AvatarUpload({ userId, initialUrl }: { userId: string; initialUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const publicUrl = await uploadFile("avatars", f, `avatar-${userId}-`);
      await createClient().from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      setUrl(publicUrl);
      router.refresh();
    } catch { /* falha silenciosa */ }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-brand/15"
        title="Trocar foto de perfil"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Foto de perfil" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-brand"><User size={30} /></span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? <Loader2 size={18} className="animate-spin text-white" /> : <Camera size={18} className="text-white" />}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={onFile} />
    </>
  );
}
