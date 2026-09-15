import { AgentStatusBanner } from "@/components/layout/agent-status-banner"
import {
  DashboardBottomNav,
  DashboardSidebarNav,
} from "@/components/layout/dashboard-nav"
import { UserMenu } from "@/components/layout/user-menu"
import { Logo } from "@/components/shared/logo"
import { canCreateBooking, requireUser } from "@/lib/auth/dal"
import { DASHBOARD_NAV } from "@/lib/constants/navigation"

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser()
  const bookingAllowed = canCreateBooking(user)

  // Agent yang belum disetujui tetap bisa masuk, hanya menu booking dikunci.
  const navItems = DASHBOARD_NAV.map((item) => ({
    ...item,
    disabled: item.href === "/kirim" && !bookingAllowed,
  }))

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
          <Logo href="/dashboard" />
          <UserMenu user={user} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-22">
            <DashboardSidebarNav items={navItems} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6 pb-20 md:pb-0">
          <AgentStatusBanner user={user} />
          {children}
        </main>
      </div>

      <DashboardBottomNav items={navItems} />
    </div>
  )
}
