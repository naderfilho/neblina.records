import { NextResponse } from "next/server";
import { anthropic, AI_MODEL, estimateCostUsd, isAdminRequest, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

function prompt(title: string, artist: string, year?: string) {
  return `Pesquise principalmente no Discogs (https://www.discogs.com/pt_BR/) e, como apoio, na Wikipedia e no Rate Your Music, informações confiáveis sobre o disco de vinil:
Título: "${title}"
Artista: "${artist}"${year ? `\nAno aproximado: ${year}` : ""}

Depois de pesquisar, responda APENAS com um JSON válido (sem texto antes ou depois), em português do Brasil, com estas chaves:
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
    "series": "série/coleção, se houver"
  },
  "tracks": [ { "side": "A", "title": "nome da faixa" } ]
}
Liste TODAS as faixas nos lados A e B, na ordem. Se não encontrar um dado, use "" ou null. Não invente matrix codes; deixe "" se não achar.`;
}

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Chave da IA não configurada." }, { status: 500 });
    }

    const { title, artist, year } = await req.json();
    if (!title || !artist) {
      return NextResponse.json({ error: "Informe título e artista antes de usar a IA." }, { status: 400 });
    }

    const client = anthropic();
    // max_tokens generoso: o pensamento adaptativo + os resumos da busca web
    // consomem o orçamento antes do JSON final (todas as faixas + histórico +
    // mercado). Com pouco orçamento o JSON vinha truncado e a pesquisa falhava.
    const msg = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 } as never],
      messages: [{ role: "user", content: prompt(title, artist, year) }],
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

    return NextResponse.json({ ok: true, data, costUsd });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro na IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
