import { NextResponse } from "next/server";
import { anthropic, AI_MODEL, estimateCostUsd, isAdminRequest, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPT = `Você é um especialista em discos de vinil e CDs. Analise esta foto da capa e identifique o álbum.
Responda APENAS com um JSON válido, sem texto antes ou depois, com exatamente estas chaves:
{
  "title": "nome do álbum",
  "artist": "artista ou banda",
  "genre": "estilo musical em português",
  "nationality": "nacionalidade do artista em português (ex: Brasil, Estados Unidos)",
  "format": "LP, EP, Single 7\\", CD, Box Set...",
  "year": ano de lançamento como número ou null,
  "label_company": "gravadora",
  "description": "1 a 2 frases em português sobre o disco"
}
Se não tiver certeza de um campo, use "" (string vazia) ou null. Não invente dados improváveis.`;

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Chave da IA não configurada." }, { status: 500 });
    }

    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Imagem ausente" }, { status: 400 });

    const client = anthropic();
    const msg = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      thinking: { type: "disabled" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";
    const data = extractJson(text);
    const costUsd = estimateCostUsd(AI_MODEL, msg.usage);

    return NextResponse.json({ ok: true, data, costUsd });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro na IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
