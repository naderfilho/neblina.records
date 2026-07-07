import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Calendar, LayoutDashboard, ShieldCheck } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import SignOutButton from "@/components/SignOutButton";

export const metadata = { title: "Minha conta" };
export const revalidate = 0;

export default async function ContaPage() {
  const { profile } = await getSessionProfile();
  if (!profile) redirect("/login?next=/conta");

  const fields = [
    { icon: User, label: "Nome", value: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "—" },
    { icon: Mail, label: "E-mail", value: profile.email ?? "—" },
    { icon: Phone, label: "Telefone", value: profile.phone || "—" },
    { icon: Calendar, label: "Cadastrado em", value: formatDate(profile.created_at) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/15 text-brand">
          <User size={30} />
        </div>
        <div>
          <h1 className="font-display text-3xl text-ink">Olá, {profile.first_name || "colecionador"}!</h1>
          <p className="text-muted">Bem-vindo de volta à Neblina.</p>
        </div>
      </div>

      {profile.role === "admin" && (
        <Link
          href="/admin"
          className="mb-6 flex items-center justify-between rounded-2xl border border-brand/40 bg-brand/10 px-5 py-4 transition-colors hover:bg-brand/15"
        >
          <span className="flex items-center gap-3 text-brand">
            <ShieldCheck size={20} /> Você é administrador — acessar painel
          </span>
          <LayoutDashboard size={20} className="text-brand" />
        </Link>
      )}

      <div className="card p-6">
        <h2 className="mb-4 font-display text-xl text-ink">Seus dados</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <f.icon size={18} className="mt-0.5 text-teal" />
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">{f.label}</dt>
                <dd className="text-ink">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
