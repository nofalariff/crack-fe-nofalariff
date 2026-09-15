"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Boxes,
  LayoutDashboard,
  PackagePlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { NavIconKey, NavItem } from "@/lib/constants/navigation"
import { cn } from "@/lib/utils"

/**
 * Pemetaan kunci ikon → komponen ikon.
 *
 * Dilakukan di sisi klien karena komponen ikon tidak dapat diserialkan saat
 * dikirim dari Server Component sebagai props.
 */
const ICONS: Partial<Record<NavIconKey, LucideIcon>> = {
  dashboard: LayoutDashboard,
  kirim: PackagePlus,
  kiriman: Boxes,
  penerima: Users,
  profil: UserRound,
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Navigasi samping untuk layar lebar. */
export function DashboardSidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Navigasi dashboard" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard
        const active = isActive(pathname, item.href)

        if (item.disabled) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              title="Tersedia setelah akun agen Anda disetujui"
              className="text-muted-foreground/60 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm"
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </span>
          )
        }

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
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Navigasi bawah untuk layar kecil. */
export function DashboardBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi dashboard"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard
          const active = isActive(pathname, item.href)

          return (
            <li key={item.href} className="flex-1">
              {item.disabled ? (
                <span
                  aria-disabled="true"
                  className="text-muted-foreground/60 flex cursor-not-allowed flex-col items-center gap-1 px-1 py-2.5 text-[11px]"
                >
                  <Icon className="size-5" aria-hidden />
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px]",
                    active
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
