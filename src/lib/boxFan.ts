/**
 * Posições dos discos no "leque" do box — usado tanto na abertura da página do
 * box (BoxOpener) quanto no hover dos cards (BoxHoverFan), pra a animação ser
 * idêntica nos dois lugares.
 *
 * `w` = largura do palco (px); `disc` = tamanho de cada disco (px). Cada disco i
 * abre num arco parabólico centrado na caixa, com uma leve rotação em leque.
 */
export type FanPos = { x: number; y: number; rotate: number };

export function fanPositions(n: number, w: number, disc: number): FanPos[] {
  const c = (n - 1) / 2;
  const step = Math.min(15, 84 / Math.max(1, n));
  return Array.from({ length: n }, (_, i) => {
    const off = i - c;
    return {
      x: off * Math.min(w * 0.17, disc * 0.82),
      y: -w * 0.11 + off * off * (w * 0.006),
      rotate: off * step,
    };
  });
}
