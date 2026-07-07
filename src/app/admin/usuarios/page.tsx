import { Shield, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils";
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

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-bg-soft text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3">Último login</th>
              <th className="px-4 py-3">Papel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-panel/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                      {(u.first_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-ink">{`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-muted">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-muted">{u.last_login_at ? formatDateTime(u.last_login_at) : "—"}</td>
                <td className="px-4 py-3">
                  {u.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs text-brand">
                      <Shield size={12} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-panel-2 px-2.5 py-1 text-xs text-muted">
                      <User size={12} /> Cliente
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-muted">Nenhum usuário ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
