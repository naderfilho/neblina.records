import { describe, expect, test } from "vitest";
import { visibleTagIds } from "@/lib/tags";

const daquiADias = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

describe("visibleTagIds", () => {
  test("tag sem prazo e permanente", () => {
    expect(visibleTagIds({ tag_ids: ["promo", "raro"] })).toEqual(["promo", "raro"]);
  });

  test("tag com prazo no futuro continua visivel", () => {
    const rec = { tag_ids: ["promo"], tag_expiries: { promo: daquiADias(7) } };
    expect(visibleTagIds(rec)).toEqual(["promo"]);
  });

  test("tag expirada some; as demais permanecem", () => {
    const rec = {
      tag_ids: ["promo", "raro"],
      tag_expiries: { promo: daquiADias(-1) },
    };
    expect(visibleTagIds(rec)).toEqual(["raro"]);
  });

  test("todas expiradas resulta em lista vazia", () => {
    const rec = {
      tag_ids: ["a", "b"],
      tag_expiries: { a: daquiADias(-10), b: daquiADias(-1) },
    };
    expect(visibleTagIds(rec)).toEqual([]);
  });

  test("disco sem tags nao quebra", () => {
    expect(visibleTagIds({ tag_ids: null as unknown as string[] })).toEqual([]);
  });

  test("tag_expiries nulo trata tudo como permanente", () => {
    expect(visibleTagIds({ tag_ids: ["x"], tag_expiries: null })).toEqual(["x"]);
  });
});
