"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const KEY = "neblina_intro_seen";

type Fly = { x: number; y: number; scale: number };

export default function IntroCurtain() {
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [fly, setFly] = useState<Fly | null>(null);
  const discRef = useRef<HTMLDivElement>(null);

  function finish() {
    setShow(false);
    sessionStorage.setItem(KEY, "1");
    document.documentElement.classList.add("intro-seen"); // esconde o shell SSR
    document.body.style.overflow = "";
  }

  // calcula o "voo" do disco da abertura até o disco do hero (magic-move)
  function computeFly(): Fly {
    const disc = discRef.current?.getBoundingClientRect();
    const hero = document.getElementById("hero-vinyl-disc")?.getBoundingClientRect();
    if (!disc || !hero || hero.width === 0) {
      // fallback: sobe um pouco e mantém o tamanho
      return { x: 0, y: -60, scale: 1 };
    }
    const dcx = disc.left + disc.width / 2;
    const dcy = disc.top + disc.height / 2;
    const hcx = hero.left + hero.width / 2;
    const hcy = hero.top + hero.height / 2;
    return { x: hcx - dcx, y: hcy - dcy, scale: hero.width / disc.width };
  }

  function startExit() {
    setFly(computeFly());
    setExiting(true);
    // esconde o shell SSR já no início da saída → sem flash da logo no fim
    document.documentElement.classList.add("intro-seen");
  }

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    setShow(true);
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(startExit, 2800);
    const t2 = setTimeout(finish, 4550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  function skip() {
    if (exiting) return;
    startExit();
    setTimeout(finish, 1750);
  }

  // easing suave (Material standard) e duração maior p/ o encaixe ficar "smooth"
  const flyTransition = { duration: 1.55, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          onClick={skip}
          className="fixed inset-0 z-[320] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* fundo (névoa) — some para revelar a home enquanto o disco voa */}
          <motion.div
            className="mist-bg absolute inset-0"
            initial={{ opacity: 1 }}
            animate={exiting ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.9, delay: exiting ? 0.35 : 0, ease: [0.5, 0, 0.2, 1] }}
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
                initial={{ scale: 0.55, opacity: 0, rotate: -40, x: 0, y: 0 }}
                animate={
                  fly
                    ? { scale: fly.scale, opacity: 1, rotate: 360, x: fly.x, y: fly.y }
                    : { scale: 1, opacity: 1, rotate: 360, x: 0, y: 0 }
                }
                transition={{
                  // mesma velocidade do disco do hero (6s/volta) p/ o encaixe
                  // acontecer sem "tick" de diferença de rotação
                  rotate: { duration: 6, ease: "linear", repeat: Infinity },
                  scale: fly ? flyTransition : { duration: 0.9, ease: "backOut" },
                  x: flyTransition,
                  y: flyTransition,
                  opacity: { duration: 0.6 },
                }}
              >
                <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
                {/* label = logo */}
                <div className="absolute left-1/2 top-1/2 flex h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-[#0b0b0b] ring-2 ring-brand/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Neblina" className="h-[88%] w-[88%] object-contain" />
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
