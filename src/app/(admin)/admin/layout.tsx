import { redirect } from "next/navigation"

import { UserMenu } from "@/components/layout/user-menu"
import { Logo } from "@/components/shared/logo"
import { requireUser } from "@/lib/auth/dal"

/**
 * Kerangka area admin.
 *
 * Panel operasional lengkap (daftar kiriman, update status, verifikasi
 * pembayaran, approval agen, kelola tarif) adalah fase terpisah. Yang ada di
 * sini hanya kerangka dan penjaga aksesnya, supaya akun admin punya tempat
 * mendarat yang benar alih-alih halaman 404.
 */
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser("/admin")

  // Penjagaan sebenarnya tetap di backend; ini mencegah non-admin melihat
  // kerangka halaman sebelum dialihkan.
  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
              Admin
            </span>
          </div>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6">
        {children}
      </main>
    </div>
  )
}
