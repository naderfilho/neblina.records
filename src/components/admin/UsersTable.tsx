"use client";

import { useMemo, useState } from "react";
import { Shield, User, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types";

type SortKey = "recent" | "old" | "az" | "za" | "younger" | "older";

function ageFrom(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (isNaN(b.getTime())) return null;
  // idade em anos (sem usar Date.now no server — isto roda no client)
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

export default function UsersTable({ users }: { users: Profile[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [gender, setGender] = useState("");
  const [uf, setUf] = useState("");

  const ufs = useMemo(
    () => Array.from(new Set(users.map((u) => u.state).filter((s): s is string => !!s))).sort(),
    [users],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = users.filter((u) => {
      if (gender && (u.gender ?? "") !== gender) return false;
      if (uf && (u.state ?? "") !== uf) return false;
      if (needle) {
        const hay = `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.email ?? ""} ${u.city ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const name = (u: Profile) => `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim().toLowerCase();
    const t = (s: string | null) => (s ? new Date(s).getTime() : 0);
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "recent": return t(b.created_at) - t(a.created_at);
        case "old": return t(a.created_at) - t(b.created_at);
        case "az": return name(a).localeCompare(name(b));
        case "za": return name(b).localeCompare(name(a));
        case "younger": return (ageFrom(a.birth_date) ?? 999) - (ageFrom(b.birth_date) ?? 999);
        case "older": return (ageFrom(b.birth_date) ?? -1) - (ageFrom(a.birth_date) ?? -1);
        default: return 0;
      }
    });
    return list;
  }, [users, q, sort, gender, uf]);

  const sel = "rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50";

  return (
    <div>
      {/* filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nome, e-mail ou cidade" className={`${sel} w-full pl-9`} />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={sel} title="Ordenar">
          <option value="recent">Mais recentes</option>
          <option value="old">Mais antigos</option>
          <option value="az">Nome (A–Z)</option>
          <option value="za">Nome (Z–A)</option>
          <option value="younger">Mais novos</option>
          <option value="older">Mais velhos</option>
        </select>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className={sel} title="Gênero">
          <option value="">Todos os gêneros</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Outro">Outro</option>
        </select>
        <select value={uf} onChange={(e) => setUf(e.target.value)} className={sel} title="Estado">
          <option value="">Todos os estados</option>
          {ufs.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <p className="mb-3 text-sm text-muted">{shown.length} de {users.length} usuários</p>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-bg-soft text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Gênero</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Idade</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3">Papel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((u) => {
              const age = ageFrom(u.birth_date);
              const local = [u.city, u.state].filter(Boolean).join(" / ");
              return (
                <tr key={u.id} className="hover:bg-panel/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                        {(u.first_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-ink">{`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <div className="flex flex-col">
                      <span>{u.email ?? "—"}</span>
                      {u.phone && <span className="text-xs text-faint">{u.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{u.gender || "—"}</td>
                  <td className="px-4 py-3 text-muted">{local || "—"}</td>
                  <td className="px-4 py-3 text-muted">{age != null ? `${age}` : "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs text-brand"><Shield size={12} /> Admin</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-panel-2 px-2.5 py-1 text-xs text-muted"><User size={12} /> Cliente</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-muted">Nenhum usuário com esses filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
