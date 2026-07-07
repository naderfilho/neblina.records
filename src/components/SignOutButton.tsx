"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm text-muted hover:border-red-400/50 hover:text-red-400"
    >
      <LogOut size={16} /> Sair da conta
    </button>
  );
}
