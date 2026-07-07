import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import CursorNeedle from "@/components/CursorNeedle";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Neblina Records — Loja de Discos de Vinil | Nova Friburgo",
    template: "%s · Neblina Records",
  },
  description:
    "Curadoria de vinis, CDs e cultura musical. Acervo com mais de 3.500 itens, do clássico ao contemporâneo. Nova Friburgo, RJ.",
  metadataBase: new URL("https://neblina.records"),
  openGraph: {
    title: "Neblina Records",
    description: "Loja de discos de vinil — curadoria autêntica desde 2023.",
    images: ["/logo.png"],
  },
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${oswald.variable} ${inter.variable} h-full`}>
      <body className="mist-bg min-h-full flex flex-col antialiased">
        {children}
        <CursorNeedle />
      </body>
    </html>
  );
}
