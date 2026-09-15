"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Boxes,
  Building2,
  LayoutDashboard,
  Map,
  ScrollText,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import type { NavIconKey, NavItem } from "@/lib/constants/navigation"
import { cn } from "@/lib/utils"

/** Pemetaan kunci ikon → komponen, dilakukan di klien (ikon tidak serializable). */
const ICONS: Partial<Record<NavIconKey, LucideIcon>> = {
  dashboard: LayoutDashboard,
  kiriman: Boxes,
  pembayaran: Wallet,
  agen: Building2,
  pengguna: Users,
  rute: Map,
  audit: ScrollText,
}

export type AdminNavItem = NavItem & {
  /** Jumlah pekerjaan menunggu; 0 atau undefined berarti badge tidak tampil. */
  badgeCount?: number
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Badge({ count }: { count: number }) {
  return (
    <span className="bg-cta text-cta-foreground ml-auto min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums">
      {count > 99 ? "99+" : count}
    </span>
  )
}

/** Navigasi samping untuk layar lebar. */
export function AdminSidebarNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Navigasi admin" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard
        const active = isActive(pathname, item.href)
        const count = item.badgeCount ?? 0

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
            {count > 0 && (
              <>
                <Badge count={count} />
                <span className="sr-only">{count} menunggu tindakan</span>
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

/** Navigasi bawah untuk layar kecil — hanya menu yang paling sering dipakai. */
export function AdminBottomNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname()
  const primary = items.slice(0, 5)

  return (
    <nav
      aria-label="Navigasi admin"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {primary.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard
          const active = isActive(pathname, item.href)
          const count = item.badgeCount ?? 0

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-1 py-2.5 text-[11px]",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {count > 0 && (
                    <span className="bg-cta text-cta-foreground absolute -top-1.5 -right-2 min-w-4 rounded-full px-1 text-center text-[10px] font-semibold tabular-nums">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
