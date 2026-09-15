import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Logo />
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft aria-hidden />
              Kembali ke beranda
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        {children}
      </main>
    </div>
  )
}
