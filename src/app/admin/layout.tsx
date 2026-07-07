import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Painel Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSessionProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminNav />
      <main className="flex-1 overflow-x-hidden bg-bg">{children}</main>
    </div>
  );
}
