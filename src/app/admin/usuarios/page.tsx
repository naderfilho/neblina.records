import { createClient } from "@/lib/supabase/server";
import UsersTable from "@/components/admin/UsersTable";
import type { Profile } from "@/lib/types";

export const revalidate = 0;

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  const users = (data as Profile[]) ?? [];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Usuários</h1>
        <p className="text-muted">{users.length} cadastrados na plataforma.</p>
      </div>

      <UsersTable users={users} />
    </div>
  );
}
