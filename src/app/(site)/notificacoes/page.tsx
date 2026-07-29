import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NotificationsList from "@/components/NotificationsList";
import type { UserNotification } from "@/lib/types";

export const revalidate = 0;
export const metadata = { title: "Notificações" };

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notificacoes");

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (data as UserNotification[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <Bell size={22} className="text-brand" />
        <h1 className="font-display text-3xl text-ink">Notificações</h1>
      </div>
      <NotificationsList userId={user.id} initial={items} />
    </div>
  );
}
