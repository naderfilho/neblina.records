// Capa estática (SSR): já aparece como o DISCO redondo — igual à abertura —
// para não haver flash da logo quadrada antes/depois da animação.
export default function IntroShell() {
  return (
    <div id="intro-shell" aria-hidden>
      <div className="relative flex flex-col items-center">
        <div className="relative h-64 w-64 rounded-full vinyl-grooves shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
          <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
          <div className="absolute left-1/2 top-1/2 flex h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-[#0b0b0b] ring-2 ring-brand/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Neblina Records" className="h-[86%] w-[86%] object-contain" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
        </div>
        <div className="mt-12 text-center">
          <p className="font-display text-6xl font-extrabold tracking-tight text-brand md:text-7xl">NEBLINA</p>
          <p className="mt-1 text-sm tracking-[0.5em] text-mist">R E C O R D S</p>
        </div>
      </div>
    </div>
  );
}
