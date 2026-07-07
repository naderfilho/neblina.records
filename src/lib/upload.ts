"use client";

import { createClient } from "@/lib/supabase/client";

function ext(name: string) {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "bin";
}

/** Faz upload de um arquivo para um bucket e retorna a URL pública. */
export async function uploadFile(bucket: string, file: File, prefix = ""): Promise<string> {
  const supabase = createClient();
  const path = `${prefix}${crypto.randomUUID()}.${ext(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
