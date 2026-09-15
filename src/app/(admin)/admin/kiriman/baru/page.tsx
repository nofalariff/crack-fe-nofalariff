import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { WalkInForm } from "@/components/admin/walk-in-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { getAdminUsers } from "@/lib/api/admin"
import { getRoutes } from "@/lib/api/endpoints"
import { requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Buat Kiriman" }

export default async function AdminWalkInPage() {
  const [user, routes, customers, agents] = await Promise.all([
    requireUser("/admin/kiriman/baru"),
    getRoutes(),
    getAdminUsers({ role: "CUSTOMER", status: "ACTIVE", limit: 100 }),
    getAdminUsers({ role: "AGENT", status: "ACTIVE", limit: 100 }),
  ])

  // Kiriman boleh diatribusikan ke customer maupun agen yang akunnya aktif.
  const attributable = [...customers.data, ...agents.data].sort((a, b) =>
    a.fullName.localeCompare(b.fullName)
  )

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/admin/kiriman">
          <ArrowLeft aria-hidden />
          Kembali ke daftar kiriman
        </Link>
      </Button>

      <PageHeader
        title="Buat Kiriman"
        description="Untuk pengirim yang datang langsung ke counter, atau pencatatan atas nama akun customer."
      />

      <WalkInForm
        routes={routes}
        customers={attributable}
        adminName={user.fullName}
        adminPhone={user.phone}
      />
    </>
  )
}
