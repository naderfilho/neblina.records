import { NextResponse } from "next/server";
import { anthropic, AI_MODEL, estimateCostUsd, isAdminRequest, extractJson, recordAiUsage } from "@/lib/ai";

export const runtime = "nodejs";
// Tempo generoso p/ a busca web não estourar. Requer plano Vercel Pro (até 300s);
// no Hobby o teto é 60s.
export const maxDuration = 300;

function prompt(f: { title?: string; artist: string; catalog: string; year?: string; nationality?: string; format?: string }, hasImage?: boolean) {
  const known = [
    f.title ? `Título: "${f.title}"` : "",
    `Artista: "${f.artist}"`,
    `Número de catálogo (no Discogs = "Selo"): "${f.catalog}"`,
    f.year ? `Ano: ${f.year}` : "",
    f.nationality ? `Nacionalidade da prensa/país da edição: "${f.nationality}"` : "",
    f.format ? `Tipo de disco: "${f.format}"` : "",
  ].filter(Boolean).join("\n");

  return `Você é um especialista em discos de vinil e catalogação no Discogs. PRECISÃO acima de tudo — nada de inventar.

O administrador JÁ FORNECEU estes dados (são a VERDADE — NÃO pesquise por eles, apenas reutilize-os):
${known}
${hasImage ? `\nHá uma FOTO DA CAPA anexada — use-a só para confirmar a edição e ler "STEREO"/"MONO" e nº de discos, se visível.` : ""}

SEJA RÁPIDO E ECONÔMICO: faça no MÁXIMO 2 a 3 buscas na web. Use o número de catálogo + artista para abrir DIRETO a página do release exato no Discogs (discogs.com) e ler a TRACKLIST. Os campos de HISTÓRIA você pode preencher com seu próprio conhecimento (sem buscar). Só busque o MERCADO (preços) se conseguir rápido. Não gaste buscas com o que já foi fornecido acima.

Responda APENAS com um JSON válido (sem texto antes ou depois), em português do Brasil, com estas chaves:
{
  "title": "título exato do álbum (conforme o Discogs)",
  "genre": "estilo musical",
  "nationality": "nacionalidade do artista",
  "year": ano como número ou null,
  "label_company": "gravadora",
  "format": "LP/EP/CD...",
  "description": "resumo de 2 a 3 frases",
  "history": {
    "context": "contexto do álbum",
    "curiosities": "curiosidades",
    "historical_importance": "importância histórica",
    "career_position": "posição na carreira do artista",
    "musical_influence": "influência musical"
  },
  "market": {
    "price_range": "faixa de preço atual (ex: R$ 150 a R$ 400)",
    "avg_international": "valor médio internacional (ex: US$ 40)",
    "avg_brazil": "valor médio no Brasil (ex: R$ 250)",
    "rarity": número de 1 a 5 indicando raridade
  },
  "identification": {
    "matrix_a": "código matrix do lado A, se conhecido",
    "matrix_b": "código matrix do lado B, se conhecido",
    "label_code": "código da gravadora, se conhecido",
    "series": "série/coleção, se houver",
    "sound_mode": "Mono ou Estéreo",
    "disc_count": "Simples, Duplo ou Triplo",
    "recorded_at": "onde foi gravado (estúdio, cidade/país), se constar",
    "mixed_at": "onde foi mixado, se constar",
    "mastered_at": "onde foi masterizado, se constar",
    "pressed_at": "país/local de prensagem desta edição, se constar"
  },
  "tracks": [ { "side": "A", "title": "nome da faixa" } ]
}
Liste TODAS as faixas nos lados A e B, na ordem exata do Discogs. Se um dado não constar no Discogs, use "" ou null — NÃO invente (nem matrix codes, nem faixas).`;
}

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Chave da IA não configurada." }, { status: 500 });
    }

    const { title, artist, catalog, year, nationality, format, imageBase64, mediaType } = await req.json();
    if (!artist || !catalog) {
      return NextResponse.json({ error: "Informe o artista e o número de catálogo antes de usar a IA." }, { status: 400 });
    }

    const client = anthropic();
    const content: unknown[] = [];
    if (imageBase64) {
      content.push({ type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } });
    }
    content.push({ type: "text", text: prompt({ title, artist, catalog, year, nationality, format }, !!imageBase64) });

    // Menos buscas (3) e teto de tokens menor: com os dados fornecidos pelo admin,
    // a IA precisa basicamente confirmar o release e trazer a tracklist — isso
    // reduz o tempo (evita timeout na Vercel) e o custo por pesquisa.
    const msg = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 9000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      // busca restrita ao Discogs (allowed_domains) — nada de outras fontes
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3, allowed_domains: ["discogs.com"] } as never],
      messages: [{ role: "user", content: content as never }],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? b.text : ""))
      .join("\n");

    if (!text.trim()) {
      return NextResponse.json(
        { error: "A IA não retornou dados. Tente novamente." },
        { status: 502 },
      );
    }

    let data: unknown;
    try {
      data = extractJson(text);
    } catch {
      return NextResponse.json(
        { error: "A IA respondeu, mas o resultado veio incompleto. Tente novamente." },
        { status: 502 },
      );
    }
    const costUsd = estimateCostUsd(AI_MODEL, msg.usage);
    await recordAiUsage("research", AI_MODEL, msg.usage, costUsd);

    return NextResponse.json({ ok: true, data, costUsd });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro na IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
