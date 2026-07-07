"use client";

import { useEffect, useRef, useState } from "react";
import { Languages, Check } from "lucide-react";

const LANGS = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement?: new (opts: object, el: string) => void } };
  }
}

function currentLang(): string {
  const m = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return m ? m[1] : "pt";
}

export default function TranslateButton() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("pt");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLang(currentLang());
    // Se já havia tradução ativa nesta sessão, carrega o widget para poder alternar.
    if (currentLang() !== "pt") ensureWidget();

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // injeta o widget do Google Translate apenas na primeira interação
  function ensureWidget() {
    if (document.getElementById("google-translate-script")) return;
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "pt", autoDisplay: false },
          "google_translate_element",
        );
      }
    };
    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);
  }

  function translateTo(code: string) {
    setLang(code);
    setOpen(false);
    ensureWidget();

    const applyCombo = (attempt = 0) => {
      const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (combo) {
        combo.value = code === "pt" ? "" : code;
        combo.dispatchEvent(new Event("change"));
        if (code === "pt") {
          // limpa o cookie e recarrega para voltar ao original
          document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          setTimeout(() => window.location.reload(), 100);
        }
      } else if (attempt < 20) {
        setTimeout(() => applyCombo(attempt + 1), 250);
      }
    };
    applyCombo();
  }

  const active = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative" ref={ref}>
      <div id="google_translate_element" className="absolute h-0 w-0 overflow-hidden" />
      <button
        onClick={() => { ensureWidget(); setOpen((v) => !v); }}
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-ink transition-colors hover:bg-panel"
        aria-label="Traduzir página"
        title="Traduzir página"
      >
        <Languages size={19} />
        <span className="hidden text-sm md:inline">{active.flag}</span>
      </button>
      {open && (
        <div
          className="notranslate absolute right-0 z-[95] mt-2 w-44 overflow-hidden rounded-xl border border-line bg-panel shadow-2xl"
          translate="no"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => translateTo(l.code)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm text-ink hover:bg-panel-2"
            >
              <span className="flex items-center gap-2">
                <span>{l.flag}</span> {l.label}
              </span>
              {lang === l.code && <Check size={15} className="text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
