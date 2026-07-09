"use client";

let ctx: AudioContext | null = null;

/** Som curto de agulha "riscando" o disco — tocado a cada troca de faixa. */
export function playScratch(intensity = 1) {
  try {
    if (typeof window === "undefined") return;
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    const dur = 0.2;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n); // ruído decaindo
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.3;
    bp.frequency.setValueAtTime(2200, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.55 * intensity, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + dur);
  } catch {
    /* silencioso */
  }
}
