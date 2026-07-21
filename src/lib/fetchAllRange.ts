/**
 * Busca TODAS as linhas de uma consulta ao Supabase paginando por `range`.
 * O PostgREST corta cada resposta em 1000 linhas, então uma leitura direta de
 * uma tabela grande (ex.: `records`, hoje com ~3000 discos) retorna no máximo
 * 1000 registros silenciosamente. Este helper repete a consulta em blocos de
 * 1000 até esgotar.
 *
 * `build(from, to)` deve devolver a query JÁ com `.select(...)`, uma ordenação
 * estável (inclua `id` como desempate) e `.range(from, to)`. Funciona tanto com
 * o client do servidor quanto o do browser.
 */
export async function fetchAllRange<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = [];
  const SIZE = 1000;
  for (let from = 0; ; from += SIZE) {
    const { data, error } = await build(from, from + SIZE - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < SIZE) break;
  }
  return all;
}
