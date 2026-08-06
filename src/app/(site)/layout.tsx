import Providers from "@/components/Providers";
import VisitLogger from "@/components/VisitLogger";
import { getSessionProfile } from "@/lib/auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();
  return (
    <Providers profile={profile}>
      <VisitLogger />
      {children}
    </Providers>
  );
}
