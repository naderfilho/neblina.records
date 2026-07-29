import { Send } from "lucide-react";
import BroadcastComposer from "@/components/admin/BroadcastComposer";

export const metadata = { title: "Enviar aviso" };

export default function AdminNotificarPage() {
  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-display text-3xl text-ink"><Send size={24} className="text-brand" /> Enviar aviso aos clientes</h1>
        <p className="text-muted">Escolha um tipo, ajuste o texto e dispare para a caixa de entrada de todos os clientes cadastrados.</p>
      </div>
      <BroadcastComposer />
    </div>
  );
}
