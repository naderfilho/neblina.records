import Link from "next/link";
import { MessageSquare, Heart, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NotifUser from "@/components/admin/NotifUser";

export const revalidate = 0;

type Notif = {
  kind: "comment" | "favorite";
  created_at: string;
  userId: string | null;
  userName: string;
  email: string | null;
  phone: string | null;
  recordId: string;
  recordTitle: string;
  body?: string;
  isQuestion?: boolean;
};

function when(iso: string) {
  let s = iso.trim().replace(" ", "T");
  const hasTz = /[zZ]$/.test(s) || /[+-]\d{2}(:\d{2})?$/.test(s);
  if (!hasTz) s += "Z";
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  return new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function NotificacoesPage() {
  const supabase = await createClient();

  const [{ data: comments }, { data: favorites }] = await Promise.all([
    supabase.from("comments").select("id,body,is_question,created_at,record_id,user_id").order("created_at", { ascending: false }).limit(40),
    supabase.from("favorites").select("record_id,user_id,created_at").order("created_at", { ascending: false }).limit(40),
  ]);

  const cs = (comments ?? []) as { body: string; is_question: boolean; created_at: string; record_id: string; user_id: string | null }[];
  const fs = (favorites ?? []) as { record_id: string; user_id: string | null; created_at: string }[];

  const userIds = [...new Set([...cs, ...fs].map((x) => x.user_id).filter(Boolean))] as string[];
  const recordIds = [...new Set([...cs, ...fs].map((x) => x.record_id))];

  const [{ data: profs }, { data: recs }] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("id,first_name,last_name,email,phone").in("id", userIds) : Promise.resolve({ data: [] }),
    recordIds.length ? supabase.from("records").select("id,title").in("id", recordIds) : Promise.resolve({ data: [] }),
  ]);

  const pMap = new Map((profs ?? []).map((p: { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null }) => [p.id, p]));
  const rMap = new Map((recs ?? []).map((r: { id: string; title: string }) => [r.id, r.title]));

  const nameOf = (uid: string | null) => {
    const p = uid ? pMap.get(uid) : null;
    return p ? (`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Usuário") : "Alguém";
  };

  const notifs: Notif[] = [
    ...cs.map((c): Notif => {
      const p = c.user_id ? pMap.get(c.user_id) : null;
      return {
        kind: "comment", created_at: c.created_at, userId: c.user_id, userName: nameOf(c.user_id),
        email: p?.email ?? null, phone: p?.phone ?? null,
        recordId: c.record_id, recordTitle: rMap.get(c.record_id) ?? "disco", body: c.body, isQuestion: c.is_question,
      };
    }),
    ...fs.map((f): Notif => {
      const p = f.user_id ? pMap.get(f.user_id) : null;
      return {
        kind: "favorite", created_at: f.created_at, userId: f.user_id, userName: nameOf(f.user_id),
        email: p?.email ?? null, phone: p?.phone ?? null,
        recordId: f.record_id, recordTitle: rMap.get(f.record_id) ?? "disco",
      };
    }),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 60);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-display text-3xl text-ink"><Bell size={26} className="text-brand" /> Notificações</h1>
        <p className="text-muted">Comentários e favoritos recentes dos clientes. Clique no nome para ver o contato.</p>
      </div>

      {notifs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">Nenhuma atividade ainda.</p>
      ) : (
        <div className="space-y-2">
          {notifs.map((n, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-line bg-panel p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-soft">
                {n.kind === "comment" ? <MessageSquare size={16} className="text-teal" /> : <Heart size={16} className="text-red-400" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  <NotifUser name={n.userName} email={n.email} phone={n.phone} />{" "}
                  {n.kind === "comment"
                    ? <>{n.isQuestion ? "perguntou" : "comentou"} em </>
                    : <>adicionou aos favoritos </>}
                  <Link href={`/disco/${n.recordId}`} className="font-medium text-ink hover:text-brand">“{n.recordTitle}”</Link>
                </p>
                {n.kind === "comment" && n.body && (
                  <p className="mt-1 line-clamp-2 rounded-lg bg-bg-soft px-3 py-2 text-sm text-muted">{n.body}</p>
                )}
                <p className="mt-1 text-xs text-faint">{when(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
