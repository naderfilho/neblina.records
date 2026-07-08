"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const KEY = "neblina_intro_seen";

export default function IntroCurtain() {
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);

  function finish() {
    setShow(false);
    sessionStorage.setItem(KEY, "1");
    document.documentElement.classList.add("intro-seen"); // esconde o shell SSR
    document.body.style.overflow = "";
  }

  function startExit() {
    setExiting(true);
    // esconde o shell SSR já no início da saída → sem flash da logo no fim
    document.documentElement.classList.add("intro-seen");
  }

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    setShow(true);
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(startExit, 3000);
    const t2 = setTimeout(finish, 3900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  function skip() {
    startExit();
    setTimeout(finish, 700);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          onClick={skip}
          className="mist-bg fixed inset-0 z-[320] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          animate={exiting ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.5, 0, 0.2, 1] }}
        >
          {/* halo de luz */}
          <motion.div
            className="absolute h-[560px] w-[560px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(245,160,40,0.18), transparent 62%)" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
          />

          {/* disco + braço */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="relative h-64 w-64 rounded-full vinyl-grooves shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
              initial={{ scale: 0.55, opacity: 0, rotate: -40 }}
              animate={exiting ? { scale: 0.5, opacity: 1, rotate: 360, y: -90 } : { scale: 1, opacity: 1, rotate: 360, y: 0 }}
              transition={{
                scale: { duration: 0.9, ease: exiting ? "easeInOut" : "backOut" },
                y: { duration: 0.9, ease: "easeInOut" },
                opacity: { duration: 0.6 },
                rotate: { duration: 3.2, ease: "linear", repeat: Infinity },
              }}
            >
              <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
              {/* label = logo (fundo preto) */}
              <div className="absolute left-1/2 top-1/2 flex h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-[#0b0b0b] ring-2 ring-brand/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Neblina" className="h-[88%] w-[88%] object-contain" />
              </div>
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[inset_0_0_3px_rgba(255,255,255,.4)]" />
            </motion.div>

            {/* braço/agulha descendo sobre o disco */}
            <motion.svg
              width="180"
              height="180"
              viewBox="0 0 180 180"
              className="absolute -right-24 -top-16"
              style={{ originX: "88%", originY: "12%" }}
              initial={{ rotate: -28, opacity: 0 }}
              animate={{ rotate: 8, opacity: 1 }}
              transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
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
            transition={{ duration: exiting ? 0.5 : 0.8, delay: exiting ? 0 : 0.5 }}
          >
            <p className="font-display text-6xl font-extrabold tracking-tight text-brand md:text-7xl">NEBLINA</p>
            <p className="mt-1 text-sm tracking-[0.5em] text-mist">R E C O R D S</p>
          </motion.div>

          <motion.p
            className="absolute bottom-8 text-xs tracking-widest text-faint"
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
