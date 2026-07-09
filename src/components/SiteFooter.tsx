import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { STORE } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

function Instagram({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-bg-soft/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Neblina Records" width={56} height={56} className="h-14 w-14 object-contain" />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none text-brand">NEBLINA</p>
              <p className="text-xs font-medium tracking-[0.3em] text-muted">Records</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
            Curadoria de vinis, CDs e cultura musical desde 2023. Acervo com mais de 3.500 itens,
            do clássico ao contemporâneo. Um ponto de encontro para colecionadores e amantes da música.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink">Navegar</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><a href="/#acervo" className="hover:text-brand">Discos</a></li>
            <li><Link href="/audioteca" className="hover:text-brand">Audioteca</Link></li>
            <li><Link href="/eventos" className="hover:text-brand">Eventos</Link></li>
            <li><Link href="/sobre" className="hover:text-brand">Sobre</Link></li>
            <li><Link href="/conta" className="hover:text-brand">Minha conta</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink">Contato</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-teal" />
              <a href={whatsappLink(STORE.whatsappPrimary, "Olá! Vim pelo site.")} className="hover:text-brand">
                (22) 99265-7509
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Instagram size={15} className="text-teal" />
              <a href={`https://instagram.com/${STORE.instagram}`} className="hover:text-brand">@{STORE.instagram}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-teal" />
              <a href={`mailto:${STORE.email}`} className="hover:text-brand">{STORE.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={15} className="text-teal" />
              {STORE.city}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-faint md:flex-row">
          <p>© {new Date().getFullYear()} Neblina Records. Todos os direitos reservados.</p>
          <p>
            Feito por{" "}
            <span className="font-semibold text-brand">NDR Private Agency</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
