import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Calendar, LayoutDashboard, ShieldCheck, Heart, Disc3, Ticket } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatBRL } from "@/lib/utils";
import SignOutButton from "@/components/SignOutButton";
import AvatarUpload from "@/components/AvatarUpload";
import BirthDateEditor from "@/components/BirthDateEditor";
import CouponList from "@/components/CouponList";
import type { Coupon } from "@/lib/types";

export const metadata = { title: "Minha conta" };
export const revalidate = 0;

type FavRow = { record_id: string; records: { id: string; title: string; artist: string; cover_image_url: string | null; price: number } | null };

export default async function ContaPage() {
  const { profile } = await getSessionProfile();
  if (!profile) redirect("/login?next=/conta");

  const supabase = await createClient();
  const { data: favData } = await supabase
    .from("favorites")
    .select("record_id, records(id,title,artist,cover_image_url,price)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  const favorites = ((favData ?? []) as unknown as FavRow[]).map((f) => f.records).filter((r): r is NonNullable<FavRow["records"]> => !!r);

  // Cupons visíveis ao cliente: os gerais (user_id null) + os direcionados a ele.
  // O filtro é EXPLÍCITO de propósito — sem ele, como admin o RLS (is_admin) devolve
  // TODOS os cupons de todos os clientes e eles vazavam aqui no perfil.
  const { data: couponData } = await supabase
    .from("coupons")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${profile.id}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  const now = Date.now();
  const coupons = ((couponData ?? []) as Coupon[]).filter((c) => !c.redeemed_at && (!c.expires_at || new Date(c.expires_at).getTime() > now));

  const fields = [
    { icon: User, label: "Nome", value: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "—" },
    { icon: Mail, label: "E-mail", value: profile.email ?? "—" },
    { icon: Phone, label: "Telefone", value: profile.phone || "—" },
    { icon: Calendar, label: "Cadastrado em", value: formatDate(profile.created_at) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-8 flex items-center gap-4">
        <AvatarUpload userId={profile.id} initialUrl={profile.avatar_url} />
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
            <ShieldCheck size={20} /> Você é administrador, acesse seu painel
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
          <BirthDateEditor userId={profile.id} initial={profile.birth_date} />
        </dl>
      </div>

      {/* meus cupons */}
      <div className="mt-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-ink">
          <Ticket size={18} className="text-brand" /> Meus cupons
          <span className="text-sm font-normal text-faint">({coupons.length})</span>
        </h2>
        <CouponList coupons={coupons} />
      </div>

      {/* favoritos */}
      <div className="mt-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-ink">
          <Heart size={18} className="text-red-400" /> Meus favoritos
          <span className="text-sm font-normal text-faint">({favorites.length})</span>
        </h2>
        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-12 text-center text-muted">
            <Disc3 size={30} className="mx-auto mb-2 text-faint" />
            <p>Você ainda não favoritou nenhum disco.</p>
            <p className="mt-1 text-sm text-faint">Toque no coração na página de um disco para salvá-lo aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {favorites.map((rec) => (
              <Link key={rec.id} href={`/disco/${rec.id}`} className="group">
                <div className="aspect-square overflow-hidden rounded-xl border border-line bg-panel">
                  {rec.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rec.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : <div className="flex h-full w-full items-center justify-center text-faint"><Disc3 size={28} /></div>}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium text-ink group-hover:text-brand">{rec.title}</p>
                <p className="line-clamp-1 text-xs text-muted">{rec.artist}</p>
                <p className="text-xs font-semibold text-brand">{formatBRL(rec.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
