import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { BookingWizard } from "@/components/booking/booking-wizard"
import { PageHeader } from "@/components/shared/page-header"
import { getRecipients, getRoutes } from "@/lib/api/endpoints"
import { canCreateBooking, requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Kirim Barang" }

export default async function KirimPage({ searchParams }: PageProps<"/kirim">) {
  const user = await requireUser("/kirim")

  // Agent yang belum disetujui diarahkan ke halaman status, bukan halaman error.
  if (!canCreateBooking(user)) {
    redirect("/status-pengajuan")
  }

  const [params, routes, recipients] = await Promise.all([
    searchParams,
    getRoutes(),
    getRecipients(),
  ])

  const readParam = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined

  return (
    <>
      <PageHeader
        title="Kirim Barang"
        description="Isi empat langkah berikut. Estimasi biaya selalu terlihat di samping."
      />

      <BookingWizard
        routes={routes}
        recipients={recipients}
        user={user}
        defaults={{
          serviceType: readParam("serviceType"),
          destinationCode: readParam("destinationCode"),
          weight: readParam("weight"),
        }}
      />
    </>
  )
}
