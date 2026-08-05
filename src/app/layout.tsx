import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import CursorNeedle from "@/components/CursorNeedle";
import IntroShell from "@/components/IntroShell";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Neblina Records | Loja de Discos de Vinil",
    template: "%s · Neblina Records",
  },
  description:
    "Vinis, CDs e raridades com curadoria. Acervo com mais de 3.500 itens, do clássico ao contemporâneo.",
  metadataBase: new URL("https://neblina.records"),
  openGraph: {
    title: "Neblina Records",
    description: "Loja de discos de vinil com curadoria.",
    images: ["/logo.png"],
  },
  icons: { icon: "/logo.png" },
};

// Roda antes da pintura: o shell da abertura SÓ deve aparecer na home ('/').
// Em qualquer outra rota (ex.: link direto de /disco/... encaminhado a um amigo),
// ou se a abertura já foi vista nesta sessão, escondemos o shell na hora — senão
// ele fica preso cobrindo a página (a IntroCurtain que o esconde só existe na home).
const introScript = `try{var s=false;try{s=!!sessionStorage.getItem('neblina_intro_seen')}catch(e){}if(location.pathname!=='/'||s){document.documentElement.classList.add('intro-seen')}}catch(e){document.documentElement.classList.add('intro-seen')}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${bricolage.variable} ${inter.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="mist-bg min-h-full flex flex-col antialiased">
        <IntroShell />
        {children}
        <CursorNeedle />
      </body>
    </html>
  );
}
