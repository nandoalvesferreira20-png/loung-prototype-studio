import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdminPage } from "@/lib/auth/server";
import { studioIcons } from "@/config/brand";
export const metadata = { icons: studioIcons };
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
