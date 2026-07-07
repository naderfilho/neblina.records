// Capa estática renderizada no servidor: cobre a tela já na primeira pintura,
// evitando qualquer "flash" da home antes da animação de abertura.
export default function IntroShell() {
  return (
    <div id="intro-shell" aria-hidden>
      <div className="relative h-56 w-56">
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(255,157,46,0.28), transparent 62%)" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Neblina Records" className="relative h-full w-full object-contain" />
      </div>
    </div>
  );
}
