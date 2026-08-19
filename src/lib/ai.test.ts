import { describe, expect, test, vi } from "vitest";

// O modulo de IA importa o client de servidor do Supabase (next/headers),
// que nao existe fora do runtime do Next — substituido por um stub no teste.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { estimateCostUsd, extractJson } from "@/lib/ai";

describe("estimateCostUsd", () => {
  test("calcula tokens de entrada e saida no modelo padrao", () => {
    // claude-sonnet-5: US$ 3/M entrada, US$ 15/M saida
    const custo = estimateCostUsd("claude-sonnet-5", {
      input_tokens: 1000,
      output_tokens: 500,
    });
    expect(custo).toBeCloseTo((1000 * 3 + 500 * 15) / 1_000_000, 10);
  });

  test("cache de leitura custa 0,1x e cache de escrita 1,25x da entrada", () => {
    const custo = estimateCostUsd("claude-sonnet-5", {
      cache_read_input_tokens: 1_000_000,
      cache_creation_input_tokens: 1_000_000,
    });
    expect(custo).toBeCloseTo(3 * 0.1 + 3 * 1.25, 10);
  });

  test("busca na web e cobrada a parte: US$ 0,01 por busca", () => {
    const custo = estimateCostUsd("claude-sonnet-5", {
      server_tool_use: { web_search_requests: 3 },
    });
    expect(custo).toBeCloseTo(0.03, 10);
  });

  test("modelo desconhecido usa as taxas do modelo padrao", () => {
    const desconhecido = estimateCostUsd("modelo-inexistente", { input_tokens: 1000 });
    const padrao = estimateCostUsd("claude-sonnet-5", { input_tokens: 1000 });
    expect(desconhecido).toBe(padrao);
  });

  test("uso vazio custa zero", () => {
    expect(estimateCostUsd("claude-sonnet-5", {})).toBe(0);
  });
});

describe("extractJson", () => {
  test("extrai JSON puro", () => {
    expect(extractJson('{"title":"Abbey Road"}')).toEqual({ title: "Abbey Road" });
  });

  test("extrai JSON dentro de cerca ```json", () => {
    const resposta = 'Claro! Aqui esta:\n```json\n{"year":1969}\n```';
    expect(extractJson(resposta)).toEqual({ year: 1969 });
  });

  test("extrai JSON cercado de texto (sem cerca)", () => {
    const resposta = 'O resultado e {"artist":"Beatles","ok":true} conforme pedido.';
    expect(extractJson(resposta)).toEqual({ artist: "Beatles", ok: true });
  });

  test("preserva objetos aninhados", () => {
    const resposta = '{"market":{"rarity":4},"history":{"context":"..."}}';
    expect(extractJson(resposta)).toEqual({ market: { rarity: 4 }, history: { context: "..." } });
  });

  test("lanca erro quando nao ha JSON na resposta", () => {
    expect(() => extractJson("desculpe, nao consegui identificar o disco")).toThrow(
      "Sem JSON na resposta",
    );
  });
});
