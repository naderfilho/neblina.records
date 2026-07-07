"use client";

import { useState } from "react";
import { Truck, Loader2, MapPin } from "lucide-react";
import { formatBRL } from "@/lib/utils";

// Zonas internacionais (estimativa em BRL): base + por kg
const ZONES: Record<string, { label: string; base: number; perKg: number; days: string }> = {
  sa: { label: "América do Sul", base: 120, perKg: 60, days: "8 a 20 dias" },
  na: { label: "América do Norte/Central", base: 180, perKg: 80, days: "10 a 25 dias" },
  eu: { label: "Europa", base: 200, perKg: 90, days: "10 a 25 dias" },
  as: { label: "Ásia", base: 220, perKg: 95, days: "15 a 30 dias" },
  oc: { label: "Oceania", base: 240, perKg: 100, days: "15 a 35 dias" },
  af: { label: "África", base: 230, perKg: 100, days: "15 a 35 dias" },
};

// Países -> zona
const COUNTRIES: { code: string; name: string; zone: keyof typeof ZONES }[] = [
  { code: "AR", name: "Argentina", zone: "sa" },
  { code: "UY", name: "Uruguai", zone: "sa" },
  { code: "CL", name: "Chile", zone: "sa" },
  { code: "US", name: "Estados Unidos", zone: "na" },
  { code: "CA", name: "Canadá", zone: "na" },
  { code: "MX", name: "México", zone: "na" },
  { code: "PT", name: "Portugal", zone: "eu" },
  { code: "GB", name: "Reino Unido", zone: "eu" },
  { code: "DE", name: "Alemanha", zone: "eu" },
  { code: "FR", name: "França", zone: "eu" },
  { code: "IT", name: "Itália", zone: "eu" },
  { code: "ES", name: "Espanha", zone: "eu" },
  { code: "JP", name: "Japão", zone: "as" },
  { code: "AU", name: "Austrália", zone: "oc" },
  { code: "ZA", name: "África do Sul", zone: "af" },
  { code: "OT", name: "Outro país", zone: "eu" },
];

// Regiões do Brasil por UF
const UF_REGION: Record<string, { region: string; base: number; perKg: number; days: string }> = {};
const REGIONS = {
  se: { ufs: ["SP", "RJ", "ES", "MG"], region: "Sudeste", base: 24, perKg: 8, days: "3 a 8 dias" },
  s: { ufs: ["PR", "SC", "RS"], region: "Sul", base: 29, perKg: 9, days: "4 a 9 dias" },
  co: { ufs: ["GO", "MT", "MS", "DF"], region: "Centro-Oeste", base: 34, perKg: 11, days: "5 a 11 dias" },
  ne: { ufs: ["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"], region: "Nordeste", base: 39, perKg: 13, days: "6 a 13 dias" },
  n: { ufs: ["AM", "PA", "RO", "RR", "AP", "AC", "TO"], region: "Norte", base: 47, perKg: 16, days: "8 a 18 dias" },
};
Object.values(REGIONS).forEach((r) => r.ufs.forEach((uf) => (UF_REGION[uf] = r)));

export default function ShippingCalculator({ weightGrams }: { weightGrams: number | null }) {
  const [intl, setIntl] = useState(false);
  const [cep, setCep] = useState("");
  const [country, setCountry] = useState("US");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ label: string; value: number; days: string } | null>(null);

  // peso efetivo (disco + embalagem)
  const kg = Math.max(0.35, (weightGrams ?? 180) / 1000 + 0.25);

  async function calcular() {
    setError(null);
    setResult(null);

    if (intl) {
      const c = COUNTRIES.find((x) => x.code === country)!;
      const z = ZONES[c.zone];
      setResult({ label: `${c.name} (${z.label})`, value: z.base + z.perKg * kg, days: z.days });
      return;
    }

    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Informe um CEP válido (8 dígitos).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError("CEP não encontrado.");
        setLoading(false);
        return;
      }
      const r = UF_REGION[data.uf] ?? REGIONS.se;
      setResult({
        label: `${data.localidade} - ${data.uf} (${r.region})`,
        value: r.base + r.perKg * kg,
        days: r.days,
      });
    } catch {
      setError("Não foi possível consultar o CEP agora.");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <h3 className="mb-1 flex items-center gap-2 font-display text-lg text-ink">
        <Truck size={19} className="text-brand" /> Calcular frete
      </h3>
      <p className="mb-4 text-sm text-muted">Enviamos para o Brasil e para o mundo todo.</p>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => { setIntl(false); setResult(null); setError(null); }}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${!intl ? "border-brand bg-brand/15 text-brand" : "border-line text-muted"}`}
        >
          🇧🇷 Brasil
        </button>
        <button
          onClick={() => { setIntl(true); setResult(null); setError(null); }}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${intl ? "border-brand bg-brand/15 text-brand" : "border-line text-muted"}`}
        >
          🌐 Internacional
        </button>
      </div>

      <div className="flex gap-2">
        {intl ? (
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex-1 rounded-lg border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50"
          >
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        ) : (
          <input
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="Seu CEP"
            inputMode="numeric"
            className="flex-1 rounded-lg border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50"
          />
        )}
        <button onClick={calcular} disabled={loading} className="btn-brand rounded-lg px-4 py-2.5 text-sm disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Calcular"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-4 rounded-xl border border-line bg-bg-soft p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} className="text-teal" /> {result.label}
          </p>
          <p className="mt-1 font-display text-2xl text-brand">{formatBRL(result.value)}</p>
          <p className="text-xs text-faint">Prazo estimado: {result.days} · valor final confirmado no atendimento</p>
        </div>
      )}
    </div>
  );
}
