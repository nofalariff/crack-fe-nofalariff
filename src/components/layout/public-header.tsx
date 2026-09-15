import Link from "next/link"
import { LayoutDashboard, Menu } from "lucide-react"

import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { getOptionalUser } from "@/lib/auth/dal"

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/layanan", label: "Layanan" },
  { href: "/cek-ongkir", label: "Cek Ongkir" },
  { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
]

export async function PublicHeader() {
  const user = await getOptionalUser()

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">
                <LayoutDashboard aria-hidden />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/masuk">Masuk</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/daftar">Daftar</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo href={null} />
              </SheetTitle>
            </SheetHeader>
            <nav
              aria-label="Navigasi utama"
              className="flex flex-col gap-1 px-4"
            >
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  className="justify-start"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t p-4">
              {user ? (
                <Button asChild>
                  <Link href="/dashboard">Buka Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/masuk">Masuk</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/daftar">Daftar</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
