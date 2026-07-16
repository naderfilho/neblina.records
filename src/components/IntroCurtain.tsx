"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const KEY = "neblina_intro_seen";

type Fly = { x: number; y: number; scale: number };

/**
 * Trava/destrava o scroll da página.
 * IMPORTANTE: o CSS põe `overflow-x: hidden` em `html` E em `body`, o que faz o
 * overflow-y dos dois computar como `auto` — e quem realmente rola a página é o
 * `html`. Travar só o `body` não segurava nada (o disco da intro descia junto
 * com o scroll e bagunçava o voo). Por isso travamos os dois.
 */
function lockScroll(on: boolean) {
  const v = on ? "hidden" : "";
  document.documentElement.style.overflow = v;
  document.body.style.overflow = v;
}

export default function IntroCurtain() {
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [fly, setFly] = useState<Fly | null>(null);
  const discRef = useRef<HTMLDivElement>(null);

  function finish() {
    setShow(false); // inicia a saída (fade); o scroll só é liberado quando a
    // cortina termina de sair (onExitComplete), pra não haver um instante com o
    // overlay fixo + página rolando (no mobile isso "duplicava" o disco).
    sessionStorage.setItem(KEY, "1");
    document.documentElement.classList.add("intro-seen"); // esconde o shell SSR
  }

  // cortina 100% fora da tela → libera o scroll e manda o hero baixar a agulha
  function afterExit() {
    lockScroll(false);
    window.dispatchEvent(new Event("neblina:intro-finished"));
  }

  // calcula o "voo" do disco da abertura até o disco do hero (magic-move)
  function computeFly(): Fly {
    const discEl = discRef.current;
    const heroEl = document.getElementById("hero-vinyl-disc");
    if (!discEl || !heroEl) return { x: 0, y: -60, scale: 1 }; // fallback: sobe um pouco

    const disc = discEl.getBoundingClientRect();
    const hero = heroEl.getBoundingClientRect();
    // IMPORTANTE: o disco da intro está GIRANDO. getBoundingClientRect() devolve a
    // bounding box alinhada aos eixos, que num quadrado girando é MAIOR que o lado
    // real (256px a 0°/90°, ~362px a 45°). Se usássemos disc.width como tamanho, o
    // scale sairia pequeno demais e o disco pousaria MENOR que o hero → "expandia"
    // (virava um disco maior) no handoff. offsetWidth é o tamanho de LAYOUT, imune
    // à rotação, então dá o diâmetro real e o disco chega no tamanho EXATO do hero.
    const discSize = discEl.offsetWidth;
    const heroSize = heroEl.offsetWidth;
    if (!heroSize || !discSize) return { x: 0, y: -60, scale: 1 };

    // o centro da bounding box coincide com o centro do disco mesmo girando
    // (a rotação é em torno do centro), então o posicionamento continua correto.
    const dcx = disc.left + disc.width / 2;
    const dcy = disc.top + disc.height / 2;
    const hcx = hero.left + hero.width / 2;
    const hcy = hero.top + hero.height / 2;
    return { x: hcx - dcx, y: hcy - dcy, scale: heroSize / discSize };
  }

  function startExit() {
    setFly(computeFly());
    setExiting(true);
    // esconde o shell SSR já no início da saída → sem flash da logo no fim
    document.documentElement.classList.add("intro-seen");
    // quando o disco "chega" na home (fim do voo), a home revela o disco girando
    // e a música entra — o disco da intro NÃO se funde num disco pré-existente.
    // margem além da duração do voo (1.85s): a animação de escala do framer
    // começa 1 render DEPOIS deste timer (precisa do setFly re-renderizar), então
    // ela termina um pouco depois de 1850ms. Revelar o disco do hero só em 2050ms
    // garante que o disco voador JÁ chegou no tamanho final (= hero) — sem o
    // "pulo"/expansão em que o hero (maior) aparece antes do voo terminar.
    window.setTimeout(() => {
      document.documentElement.classList.add("disc-ready");
      window.dispatchEvent(new Event("neblina:disc-arrived"));
    }, 2050);
  }

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    setShow(true);
    // trava o scroll já no início: sem isso, rolar durante a intro fazia o disco
    // do voo descer junto com a página e bagunçar o pouso no hero
    lockScroll(true);
    window.scrollTo(0, 0);
    const t1 = setTimeout(startExit, 2600);
    // finish logo após o disco assentar (disc-ready em 2050): o disco voador não
    // fica "por cima" muito tempo. Aí a cortina sai e o hero baixa a agulha.
    const t2 = setTimeout(finish, 4900);
    // rede de segurança: se o onExitComplete não disparar, libera o scroll assim mesmo
    const t3 = setTimeout(() => lockScroll(false), 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      lockScroll(false);
    };
  }, []);

  function skip() {
    if (exiting) return;
    startExit();
    setTimeout(finish, 2300);
  }

  // easing de "encaixe": desacelera bem no fim p/ o disco assentar suave no hero
  const flyTransition = { duration: 1.85, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence onExitComplete={afterExit}>
      {show && (
        <motion.div
          key="intro"
          onClick={skip}
          className="fixed inset-0 z-[320] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* fundo (névoa) — some para revelar a home enquanto o disco voa */}
          <motion.div
            className="mist-bg absolute inset-0"
            initial={{ opacity: 1 }}
            animate={exiting ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 1.1, delay: exiting ? 0.25 : 0, ease: [0.5, 0, 0.2, 1] }}
          />

          {/* halo de luz */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(245,160,40,0.18), transparent 62%)" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={exiting ? { opacity: 0, scale: 1.1 } : { opacity: 1, scale: 1 }}
            transition={{ duration: exiting ? 0.6 : 1.2 }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* disco + braço */}
            <div className="relative flex items-center justify-center">
              <motion.div
                ref={discRef}
                className="relative h-64 w-64 rounded-full vinyl-grooves shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
                style={{ zIndex: 2 }}
                // começa exatamente como o shell SSR (cheio, opaco, sem rotação)
                // -> sem "tick"/grow-in ao iniciar a animação
                initial={{ scale: 1, opacity: 1, rotate: 0, x: 0, y: 0 }}
                animate={
                  fly
                    ? { scale: fly.scale, opacity: 1, rotate: 360, x: fly.x, y: fly.y }
                    : { scale: 1, opacity: 1, rotate: 360, x: 0, y: 0 }
                }
                transition={{
                  // mesma velocidade do disco do hero (6s/volta) p/ o encaixe
                  // acontecer sem "tick" de diferença de rotação
                  rotate: { duration: 6, ease: "linear", repeat: Infinity },
                  scale: fly ? flyTransition : { duration: 0 },
                  x: flyTransition,
                  y: flyTransition,
                  opacity: { duration: 0.4 },
                }}
              >
                <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
                {/* label = logo — MESMA proporção do disco do hero (44% / logo 86%)
                    pra não haver mudança de tamanho do logo no handoff */}
                <div className="absolute left-1/2 top-1/2 flex h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-[#0b0b0b] ring-2 ring-brand/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Neblina" className="h-[86%] w-[86%] object-contain" />
                </div>
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[inset_0_0_3px_rgba(255,255,255,.4)]" />
              </motion.div>

              {/* braço/agulha — some na saída (o hero tem a sua própria agulha) */}
              <motion.svg
                width="180"
                height="180"
                viewBox="0 0 180 180"
                className="pointer-events-none absolute -right-24 -top-16"
                style={{ originX: "88%", originY: "12%", zIndex: 3 }}
                initial={{ rotate: -28, opacity: 0 }}
                animate={exiting ? { rotate: -20, opacity: 0 } : { rotate: 8, opacity: 1 }}
                transition={{ delay: exiting ? 0 : 0.9, duration: exiting ? 0.5 : 1, ease: "easeOut" }}
              >
                <defs>
                  <linearGradient id="iarm" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#e9edf1" />
                    <stop offset="1" stopColor="#5b6772" />
                  </linearGradient>
                </defs>
                <circle cx="158" cy="22" r="12" fill="#ff9d2e" stroke="#2a2118" strokeWidth="2" />
                <line x1="158" y1="22" x2="60" y2="120" stroke="url(#iarm)" strokeWidth="7" strokeLinecap="round" />
                <g transform="rotate(45 56 120)">
                  <rect x="42" y="112" width="30" height="16" rx="3" fill="url(#iarm)" />
                </g>
                <circle cx="58" cy="122" r="4" fill="#ff9d2e" />
              </motion.svg>
            </div>

            {/* wordmark — some devagar na saída */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 18 }}
              animate={exiting ? { opacity: 0, y: -14 } : { opacity: 1, y: 0 }}
              transition={{ duration: exiting ? 0.4 : 0.8, delay: exiting ? 0 : 0.5 }}
            >
              <p className="font-display text-6xl font-extrabold tracking-tight text-brand md:text-7xl">NEBLINA</p>
              <p className="mt-1 text-sm tracking-[0.5em] text-mist">R E C O R D S</p>
            </motion.div>
          </div>

          <motion.p
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-widest text-faint"
            initial={{ opacity: 0 }}
            animate={exiting ? { opacity: 0 } : { opacity: 1 }}
            transition={{ delay: exiting ? 0 : 1.6 }}
          >
            toque para entrar
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
