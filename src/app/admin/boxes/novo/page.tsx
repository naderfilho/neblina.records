import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BoxForm from "@/components/admin/BoxForm";

export const revalidate = 0;

export default function NovoBoxPage() {
  return (
    <div className="p-6 md:p-10">
      <Link href="/admin/boxes" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-6 font-display text-3xl text-ink">Novo box</h1>
      <BoxForm />
    </div>
  );
}
