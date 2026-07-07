"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import RecordCard from "@/components/RecordCard";
import { QUALITY_GRADES } from "@/lib/constants";
import type { RecordItem } from "@/lib/types";

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v && v.trim() !== ""))).sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
}

type Filters = {
  q: string;
  genre: string;
  nationality: string;
  artist: string;
  quality: string;
};

const EMPTY: Filters = { q: "", genre: "", nationality: "", artist: "", quality: "" };

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/60"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function RecordGrid({ records }: { records: RecordItem[] }) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);

  const genres = useMemo(() => uniqueSorted(records.map((r) => r.genre)), [records]);
  const nationalities = useMemo(() => uniqueSorted(records.map((r) => r.nationality)), [records]);

  // Artistas dependem do estilo/nacionalidade selecionados
  const artists = useMemo(() => {
    let pool = records;
    if (f.genre) pool = pool.filter((r) => r.genre === f.genre);
    if (f.nationality) pool = pool.filter((r) => r.nationality === f.nationality);
    return uniqueSorted(pool.map((r) => r.artist));
  }, [records, f.genre, f.nationality]);

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return records.filter((r) => {
      if (f.genre && r.genre !== f.genre) return false;
      if (f.nationality && r.nationality !== f.nationality) return false;
      if (f.artist && r.artist !== f.artist) return false;
      if (f.quality && r.disc_quality !== f.quality) return false;
      if (q && !`${r.title} ${r.artist} ${r.genre ?? ""} ${r.label_company ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [records, f]);

  const activeCount = Object.entries(f).filter(([, v]) => v).length;

  return (
    <div>
      {/* barra de filtros */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={f.q}
              onChange={(e) => setF((s) => ({ ...s, q: e.target.value }))}
              placeholder="Buscar por título, artista, gravadora…"
              className="w-full rounded-xl border border-line bg-panel py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-faint focus:border-brand/60"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-3 text-sm text-ink hover:border-brand/50"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-black">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-3 rounded-2xl border border-line bg-bg-soft p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Estilo musical</label>
              <Select
                value={f.genre}
                onChange={(v) => setF((s) => ({ ...s, genre: v, artist: "" }))}
                options={genres}
                placeholder="Todos os estilos"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Nacionalidade</label>
              <Select
                value={f.nationality}
                onChange={(v) => setF((s) => ({ ...s, nationality: v, artist: "" }))}
                options={nationalities}
                placeholder="Todas"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Artista / Banda</label>
              <Select
                value={f.artist}
                onChange={(v) => setF((s) => ({ ...s, artist: v }))}
                options={artists}
                placeholder="Todos os artistas"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Qualidade</label>
              <Select
                value={f.quality}
                onChange={(v) => setF((s) => ({ ...s, quality: v }))}
                options={[...QUALITY_GRADES]}
                placeholder="Qualquer"
              />
            </div>
            {activeCount > 0 && (
              <button
                onClick={() => setF(EMPTY)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-sm text-muted hover:text-brand sm:col-span-2 lg:col-span-4"
              >
                <X size={15} /> Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* contador */}
      <p className="mb-5 text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "disco" : "discos"}
        {activeCount > 0 && " encontrados"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-24 text-center text-muted">
          <p className="text-lg">Nenhum disco encontrado.</p>
          <p className="mt-1 text-sm text-faint">Tente ajustar os filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((r) => (
            <RecordCard key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}
