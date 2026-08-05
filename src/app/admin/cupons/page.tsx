import { createClient } from "@/lib/supabase/server";
import CouponsAdmin, { type CouponRow, type NewClient, type CustomerOpt } from "@/components/admin/CouponsAdmin";

export const revalidate = 0;

export default async function AdminCuponsPage() {
  const supabase = await createClient();

  const [{ data: couponData }, { data: newData }, { data: custData }] = await Promise.all([
    supabase.from("coupons").select("*, profiles(first_name,last_name)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,first_name,last_name,email,created_at").eq("role", "customer").is("welcomed_at", null).order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,first_name,last_name,email").eq("role", "customer").order("first_name"),
  ]);

  const coupons: CouponRow[] = ((couponData ?? []) as unknown as (CouponRow & { profiles: { first_name: string | null; last_name: string | null } | null })[]).map((c) => ({
    ...c,
    userName: c.profiles ? `${c.profiles.first_name ?? ""} ${c.profiles.last_name ?? ""}`.trim() || null : null,
  }));

  const newClients = (newData ?? []) as NewClient[];

  const customers: CustomerOpt[] = ((custData ?? []) as { id: string; first_name: string | null; last_name: string | null; email: string | null }[]).map((c) => ({
    id: c.id,
    name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || (c.email ?? "cliente"),
    email: c.email,
  }));

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Cupons</h1>
        <p className="text-muted">Gere cupons de desconto e dê as boas-vindas aos novos clientes.</p>
      </div>
      <CouponsAdmin coupons={coupons} newClients={newClients} customers={customers} />
    </div>
  );
}
