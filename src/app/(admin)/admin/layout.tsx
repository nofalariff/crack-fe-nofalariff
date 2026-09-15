import { redirect } from "next/navigation"

import {
  AdminBottomNav,
  AdminSidebarNav,
  type AdminNavItem,
} from "@/components/layout/admin-nav"
import { UserMenu } from "@/components/layout/user-menu"
import { Logo } from "@/components/shared/logo"
import { getAdminDashboard } from "@/lib/api/admin"
import { requireUser } from "@/lib/auth/dal"
import { ADMIN_NAV } from "@/lib/constants/navigation"

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser("/admin")

  // Penjagaan sebenarnya tetap di backend; ini mencegah non-admin melihat
  // kerangka halaman sebelum dialihkan.
  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Angka antrean ditempelkan ke menu supaya pekerjaan yang menunggu terlihat
  // tanpa harus membuka halamannya satu per satu.
  const summary = await getAdminDashboard().catch(() => null)

  const navItems: AdminNavItem[] = ADMIN_NAV.map((item) => ({
    ...item,
    badgeCount:
      item.badge === "payments"
        ? summary?.pendingPaymentVerification
        : item.badge === "agents"
          ? summary?.pendingAgentApproval
          : undefined,
  }))

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
              Operasional
            </span>
          </div>
          <UserMenu user={user} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-22">
            <AdminSidebarNav items={navItems} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      <AdminBottomNav items={navItems} />
    </div>
  )
}
