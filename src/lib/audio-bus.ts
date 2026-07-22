"use client";

// Garante que apenas um disco toca por vez em todo o site.
let active: HTMLAudioElement | null = null;

export function claimAudio(el: HTMLAudioElement) {
  if (active && active !== el) {
    active.pause();
  }
  active = el;
}

export function releaseAudio(el: HTMLAudioElement) {
  if (active === el) active = null;
}

// ---------------------------------------------------------------------------
// Disco ativo (giro + som)
// ---------------------------------------------------------------------------
// O barramento de áudio acima só pausa o SOM do disco anterior — e só funciona
// quando o novo disco tem áudio. Discos sem áudio nunca "reivindicavam" nada, e
// aí o disco anterior continuava girando. Este barramento guarda o `stop` do
// disco ativo e o executa por inteiro (para o giro E o som) quando outro assume.
let activeStop: (() => void) | null = null;

export function claimDisc(stop: () => void) {
  if (activeStop && activeStop !== stop) activeStop();
  activeStop = stop;
}

export function releaseDisc(stop: () => void) {
  if (activeStop === stop) activeStop = null;
}
