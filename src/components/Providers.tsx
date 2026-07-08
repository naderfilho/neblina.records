"use client";

import { type ReactNode } from "react";
import { CartProvider } from "@/lib/cart";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SiteBackground from "@/components/SiteBackground";
import CartDrawer from "@/components/CartDrawer";
import AudioUnlock from "@/components/AudioUnlock";
import type { Profile } from "@/lib/types";

export default function Providers({
  profile,
  children,
}: {
  profile: Profile | null;
  children: ReactNode;
}) {
  return (
    <CartProvider>
      <SiteBackground />
      <SiteHeader profile={profile} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <AudioUnlock />
    </CartProvider>
  );
}
