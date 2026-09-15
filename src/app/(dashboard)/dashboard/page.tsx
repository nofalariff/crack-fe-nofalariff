import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, PackagePlus, PackageSearch, Wallet } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { ShipmentCard } from "@/components/shipment/shipment-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardSummary } from "@/lib/api/endpoints"
import { canCreateBooking, requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const [user, summary] = await Promise.all([
    requireUser("/dashboard"),
    getDashboardSummary(),
  ])

  const bookingAllowed = canCreateBooking(user)
  const firstName = user.fullName.split(" ")[0]

  const stats = [
    {
      label: "Menunggu pembayaran",
      value: summary.awaitingPaymentCount,
      href: "/kiriman?status=PENDING_PAYMENT",
    },
    {
      label: "Sedang berjalan",
      value: summary.inProgressCount,
      href: "/kiriman",
    },
    {
      label: "Sudah diterima",
      value: summary.deliveredCount,
      href: "/kiriman?status=DELIVERED",
    },
    {
      label: "Total kiriman",
      value: summary.totalShipments,
      href: "/kiriman",
    },
  ]

  return (
    <>
      <PageHeader
        title={`Halo, ${firstName}`}
        description="Ringkasan kiriman Anda di LogiSend."
        action={
          bookingAllowed ? (
            <Button asChild>
              <Link href="/kirim">
                <PackagePlus aria-hidden />
                Kirim Barang
              </Link>
            </Button>
          ) : undefined
        }
      />

      {summary.awaitingPaymentCount > 0 && (
        <Alert>
          <Wallet aria-hidden />
          <AlertTitle>
            {summary.awaitingPaymentCount} kiriman menunggu pembayaran
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Kiriman baru diproses setelah pembayaran Anda diverifikasi tim
              kami.
            </p>
            <Button asChild size="sm">
              <Link href="/kiriman?status=PENDING_PAYMENT">
                Lihat & bayar sekarang
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="group-hover:border-primary/40 h-full transition-colors">
              <CardContent>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Kiriman terbaru</CardTitle>
          {summary.recentShipments.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/kiriman">
                Lihat semua
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {summary.recentShipments.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Belum ada kiriman"
              description={
                bookingAllowed
                  ? "Mulai dengan membuat booking pertama Anda. Prosesnya hanya beberapa menit."
                  : "Booking akan terbuka setelah akun agen Anda disetujui tim LogiSend."
              }
              action={
                bookingAllowed
                  ? { label: "Buat Booking", href: "/kirim" }
                  : undefined
              }
              className="border-0"
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {summary.recentShipments.map((shipment) => (
                <li key={shipment.id}>
                  <ShipmentCard shipment={shipment} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
