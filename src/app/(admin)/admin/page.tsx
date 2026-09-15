import type { Metadata } from "next"
import Link from "next/link"
import {
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  PackagePlus,
  Wallet,
} from "lucide-react"

import { StatCard } from "@/components/admin/stat-card"
import { StatusDistribution } from "@/components/admin/status-distribution"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shipment/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDashboard } from "@/lib/api/admin"
import { requireUser } from "@/lib/auth/dal"
import { formatRupiah } from "@/lib/format"

export const metadata: Metadata = { title: "Dashboard Operasional" }

export default async function AdminDashboardPage() {
  const [user, summary] = await Promise.all([
    requireUser("/admin"),
    getAdminDashboard(),
  ])

  const firstName = user.fullName.split(" ")[0]
  const nothingPending =
    summary.pendingPaymentVerification === 0 &&
    summary.pendingAgentApproval === 0 &&
    summary.stalledShipments === 0

  return (
    <>
      <PageHeader
        title={`Halo, ${firstName}`}
        description="Ringkasan pekerjaan operasional hari ini."
        action={
          <Button asChild>
            <Link href="/admin/kiriman/baru">
              <PackagePlus aria-hidden />
              Buat Kiriman
            </Link>
          </Button>
        }
      />

      {/* Lapis 1 — yang menuntut tindakan lebih dulu */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Perlu ditindaklanjuti</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pembayaran menunggu verifikasi"
            value={summary.pendingPaymentVerification}
            icon={Wallet}
            href="/admin/pembayaran"
            tone="attention"
            hint="Bukti transfer yang belum diperiksa"
          />
          <StatCard
            label="Pengajuan agen menunggu"
            value={summary.pendingAgentApproval}
            icon={Building2}
            href="/admin/agen?status=PENDING"
            tone="attention"
            hint="Agen belum bisa booking sebelum disetujui"
          />
          <StatCard
            label="Kiriman mandek"
            value={summary.stalledShipments}
            icon={Clock}
            href="/admin/kiriman"
            tone="attention"
            hint="Status tidak berubah lebih dari 3 hari"
          />
          <StatCard
            label="Kiriman aktif"
            value={summary.activeShipments}
            icon={Boxes}
            href="/admin/kiriman"
            hint={`dari total ${summary.totalShipments} kiriman`}
          />
        </div>

        {nothingPending && (
          <p className="text-success-foreground bg-success-soft flex items-center gap-2 rounded-lg px-4 py-3 text-sm">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            Tidak ada pekerjaan tertunda. Semua antrean bersih.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Lapis 3 — antrean tindakan, ditaruh besar karena paling sering dipakai */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Kiriman paling lama tidak bergerak</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/kiriman">Lihat semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {summary.needsAttention.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Tidak ada kiriman yang tertahan lebih dari 3 hari.
              </p>
            ) : (
              <ul className="divide-y">
                {summary.needsAttention.map((shipment) => (
                  <li key={shipment.id}>
                    <Link
                      href={`/admin/kiriman/${shipment.trackingNumber}`}
                      className="hover:bg-muted/50 -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium">
                          {shipment.trackingNumber}
                        </p>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {shipment.customerName} · {shipment.destinationName}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-warning-foreground bg-warning-soft rounded-full px-2 py-0.5 text-xs font-medium">
                          {shipment.daysSinceUpdate} hari
                        </span>
                        <StatusBadge status={shipment.status} size="sm" />
                        <span className="hidden text-sm font-medium tabular-nums sm:inline">
                          {formatRupiah(shipment.totalAmount)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Lapis 2 — gambaran sebaran, informatif tanpa menuntut tindakan */}
        <Card>
          <CardHeader>
            <CardTitle>Sebaran status</CardTitle>
            <p className="text-muted-foreground text-sm">
              Klik satu status untuk membuka daftarnya.
            </p>
          </CardHeader>
          <CardContent>
            <StatusDistribution counts={summary.statusCounts} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
