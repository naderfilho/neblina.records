import { HandCoins } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProposalCard from "@/components/admin/ProposalCard";
import type { SaleProposal } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPropostasPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("sale_proposals").select("*").order("created_at", { ascending: false });
  const proposals = (data as SaleProposal[]) ?? [];
  const novas = proposals.filter((p) => p.status === "new").length;

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Propostas de venda</h1>
        <p className="text-muted">
          {proposals.length} propostas de clientes querendo vender discos{novas > 0 ? ` · ${novas} nova(s)` : ""}.
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-20 text-center text-muted">
          <HandCoins size={36} className="mx-auto mb-3 text-faint" />
          Nenhuma proposta ainda. Elas chegam pela página “Venda seu disco”.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {proposals.map((p) => (
            <ProposalCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
