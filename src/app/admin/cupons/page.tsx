import { createClient } from "@/lib/supabase/server";
import CouponsAdmin, { type CouponRow } from "@/components/admin/CouponsAdmin";

export const revalidate = 0;

export default async function AdminCuponsPage() {
  const supabase = await createClient();

  const { data: couponData } = await supabase
    .from("coupons")
    .select("*, profiles(first_name,last_name)")
    .order("created_at", { ascending: false });

  const coupons: CouponRow[] = ((couponData ?? []) as unknown as (CouponRow & { profiles: { first_name: string | null; last_name: string | null } | null })[]).map((c) => ({
    ...c,
    userName: c.profiles ? `${c.profiles.first_name ?? ""} ${c.profiles.last_name ?? ""}`.trim() || null : null,
  }));

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Cupons</h1>
        <p className="text-muted">Crie um cupom de desconto para todos os clientes (ex.: NEBLINA15) e divulgue o nome.</p>
      </div>
      <CouponsAdmin coupons={coupons} />
    </div>
  );
}
