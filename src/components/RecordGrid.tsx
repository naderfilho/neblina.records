"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import RecordCard from "@/components/RecordCard";
import TagBadge from "@/components/TagBadge";
import { QUALITY_GRADES, QUALITY_META, POPULAR_NATIONALITIES, RECORD_FORMATS, GENRE_TREE, genreMatches } from "@/lib/constants";
import type { RecordItem, Tag } from "@/lib/types";

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
  format: string;
  quality: string;
  tag: string;
  sort: string; // "" | "price_asc" | "price_desc"
};

const EMPTY: Filters = { q: "", genre: "", nationality: "", artist: "", format: "", quality: "", tag: "", sort: "" };

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

export default function RecordGrid({ records, tags = [] }: { records: RecordItem[]; tags?: Tag[] }) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  // só mostra filtro de tags que existem em algum disco publicado
  const usedTags = useMemo(() => {
    const ids = new Set(records.flatMap((r) => r.tag_ids ?? []));
    return tags.filter((t) => ids.has(t.id));
  }, [records, tags]);

  // gêneros dos discos que não estão na árvore (para o grupo "Outros")
  const otherGenres = useMemo(() => {
    const known = new Set(
      Object.entries(GENRE_TREE).flatMap(([main, subs]) => [main.toLowerCase(), ...subs.map((s) => s.toLowerCase())]),
    );
    return uniqueSorted(records.map((r) => r.genre)).filter((g) => !known.has(g.toLowerCase()));
  }, [records]);
  const nationalities = useMemo(
    () => uniqueSorted([...records.map((r) => r.nationality), ...POPULAR_NATIONALITIES]),
    [records],
  );
  const formats = useMemo(
    () => uniqueSorted([...records.map((r) => r.format), ...RECORD_FORMATS]),
    [records],
  );

  // Artistas dependem do estilo/nacionalidade selecionados
  const artists = useMemo(() => {
    let pool = records;
    if (f.genre) pool = pool.filter((r) => genreMatches(r.genre, f.genre));
    if (f.nationality) pool = pool.filter((r) => r.nationality === f.nationality);
    return uniqueSorted(pool.map((r) => r.artist));
  }, [records, f.genre, f.nationality]);

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = records.filter((r) => {
      if (f.genre && !genreMatches(r.genre, f.genre)) return false;
      if (f.nationality && r.nationality !== f.nationality) return false;
      if (f.artist && r.artist !== f.artist) return false;
      if (f.format && r.format !== f.format) return false;
      if (f.quality && r.disc_quality !== f.quality) return false;
      if (f.tag && !(r.tag_ids ?? []).includes(f.tag)) return false;
      if (q && !`${r.title} ${r.artist} ${r.genre ?? ""} ${r.label_company ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
    if (f.sort === "price_asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (f.sort === "price_desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
    return list;
  }, [records, f]);

  // "sort" é uma ordenação, não um filtro — não conta no badge de filtros ativos
  const activeCount = Object.entries(f).filter(([k, v]) => v && k !== "sort").length;

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
              <select
                value={f.genre}
                onChange={(e) => setF((s) => ({ ...s, genre: e.target.value, artist: "" }))}
                className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/60"
              >
                <option value="">Todos os estilos</option>
                {Object.entries(GENRE_TREE).map(([main, subs]) => (
                  <optgroup key={main} label={main}>
                    <option value={main}>{main} (todos)</option>
                    {subs.map((s) => (
                      <option key={main + s} value={s}>&nbsp;&nbsp;{s}</option>
                    ))}
                  </optgroup>
                ))}
                {otherGenres.length > 0 && (
                  <optgroup label="Outros">
                    {otherGenres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                )}
              </select>
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
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Tipo de disco</label>
              <Select
                value={f.format}
                onChange={(v) => setF((s) => ({ ...s, format: v }))}
                options={formats}
                placeholder="Todos os tipos"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Qualidade (Goldmine)</label>
              <select
                value={f.quality}
                onChange={(e) => setF((s) => ({ ...s, quality: e.target.value }))}
                className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/60"
              >
                <option value="">Qualquer</option>
                {QUALITY_GRADES.map((q) => (
                  <option key={q} value={q}>{QUALITY_META[q].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Ordenar por preço</label>
              <select
                value={f.sort}
                onChange={(e) => setF((s) => ({ ...s, sort: e.target.value }))}
                className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/60"
              >
                <option value="">Padrão</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
            </div>
            {(activeCount > 0 || f.sort) && (
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

      {/* filtro por etiquetas */}
      {usedTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setF((s) => ({ ...s, tag: "" }))}
            className={`rounded-full border px-3 py-1.5 text-xs ${f.tag === "" ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink"}`}
          >
            Todos
          </button>
          {usedTags.map((t) => {
            const on = f.tag === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setF((s) => ({ ...s, tag: s.tag === t.id ? "" : t.id }))}
                // inline-flex faz o botão abraçar o badge (sem o vão do line-height,
                // que deixava a caixa em 30px e o anel laranja "fora" do chip de 16px)
                className="inline-flex rounded-full outline-none transition"
                // selecionado = anel fino da marca com um respiro na cor do fundo
                style={on ? { boxShadow: "0 0 0 2px var(--color-bg), 0 0 0 3px var(--color-brand)" } : { opacity: 0.75 }}
              >
                <TagBadge tag={t} size="md" />
              </button>
            );
          })}
        </div>
      )}

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
            <RecordCard
              key={r.id}
              record={r}
              tags={(r.tag_ids ?? []).map((id) => tagMap.get(id)).filter((t): t is Tag => !!t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
