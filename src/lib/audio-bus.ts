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
