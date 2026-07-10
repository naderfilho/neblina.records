import { NextResponse } from "next/server";
import { anthropic, AI_MODEL, estimateCostUsd, isAdminRequest, extractJson, recordAiUsage } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

function prompt(title: string, artist: string, year?: string, hasImage?: boolean) {
  return `Você é um especialista em discos de vinil e catalogação no Discogs. Sua prioridade é PRECISÃO — nada de inventar.

Dados informados pelo administrador (são a verdade — use-os como referência principal):
Título: "${title}"
Artista: "${artist}"${year ? `\nAno aproximado: ${year}` : ""}
${hasImage ? `\nHá uma FOTO DA CAPA anexada. Leia-a com MUITA ATENÇÃO: título, artista, ano, gravadora, número de catálogo, se está impresso "STEREO" ou "MONO", e se é disco simples/duplo/triplo (ex.: "2 LP", "Duplo"). O que estiver impresso na capa tem prioridade sobre suposições.` : ""}

Pesquise EXCLUSIVAMENTE no Discogs (discogs.com) — não use nenhuma outra fonte. Encontre a edição/lançamento exato que corresponde a este título, artista${year ? " e ano" : ""}${hasImage ? " e à capa" : ""}. Confira a tracklist, a gravadora, o país, o formato e os canais (mono/estéreo) na página do release no Discogs.

Depois responda APENAS com um JSON válido (sem texto antes ou depois), em português do Brasil, com estas chaves:
{
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

    const { title, artist, year, imageBase64, mediaType } = await req.json();
    if (!title || !artist) {
      return NextResponse.json({ error: "Informe título e artista antes de usar a IA." }, { status: 400 });
    }

    const client = anthropic();
    const content: unknown[] = [];
    if (imageBase64) {
      content.push({ type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } });
    }
    content.push({ type: "text", text: prompt(title, artist, year, !!imageBase64) });

    // max_tokens generoso: o pensamento adaptativo + os resumos da busca web
    // consomem o orçamento antes do JSON final (todas as faixas + histórico +
    // mercado). Com pouco orçamento o JSON vinha truncado e a pesquisa falhava.
    const msg = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      // busca restrita ao Discogs (allowed_domains) — nada de outras fontes
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6, allowed_domains: ["discogs.com"] } as never],
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
