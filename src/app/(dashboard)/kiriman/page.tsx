import type { Metadata } from "next"
import Link from "next/link"
import { PackagePlus, PackageSearch } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { ShipmentCard } from "@/components/shipment/shipment-card"
import { ShipmentFilters } from "@/components/shipment/shipment-filters"
import { StatusBadge } from "@/components/shipment/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getShipments } from "@/lib/api/endpoints"
import { canCreateBooking, requireUser } from "@/lib/auth/dal"
import { getServiceMeta } from "@/lib/constants/service-type"
import { formatDateShort, formatRupiah, formatWeight } from "@/lib/format"
import type { ServiceType, ShipmentStatus } from "@/types/api"

export const metadata: Metadata = { title: "Kiriman Saya" }

const PAGE_SIZE = 20

export default async function KirimanPage({
  searchParams,
}: PageProps<"/kiriman">) {
  const [user, params] = await Promise.all([
    requireUser("/kiriman"),
    searchParams,
  ])

  const readParam = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined

  const page = Number(readParam("page") ?? 1) || 1

  const { data: shipments, meta } = await getShipments({
    page,
    limit: PAGE_SIZE,
    status: readParam("status") as ShipmentStatus | undefined,
    serviceType: readParam("serviceType") as ServiceType | undefined,
    search: readParam("search"),
    dateFrom: readParam("dateFrom"),
    dateTo: readParam("dateTo"),
  })

  const hasFilter = Boolean(
    readParam("status") ??
    readParam("serviceType") ??
    readParam("search") ??
    readParam("dateFrom") ??
    readParam("dateTo")
  )

  const bookingAllowed = canCreateBooking(user)
  const totalPages = meta?.totalPages ?? 1

  function pageHref(target: number) {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && key !== "page") next.set(key, value)
    }
    if (target > 1) next.set("page", String(target))
    const query = next.toString()
    return query ? `/kiriman?${query}` : "/kiriman"
  }

  return (
    <>
      <PageHeader
        title="Kiriman Saya"
        description={
          meta
            ? `${meta.total} kiriman ditemukan.`
            : "Seluruh kiriman atas akun Anda."
        }
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

      <ShipmentFilters />

      {shipments.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={
            hasFilter ? "Tidak ada kiriman yang cocok" : "Belum ada kiriman"
          }
          description={
            hasFilter
              ? "Coba ubah atau hapus filter untuk melihat kiriman lainnya."
              : bookingAllowed
                ? "Setiap booking yang Anda buat akan muncul di sini beserta status terkininya."
                : "Booking akan terbuka setelah akun agen Anda disetujui tim LogiSend."
          }
          action={
            hasFilter
              ? { label: "Hapus filter", href: "/kiriman" }
              : bookingAllowed
                ? { label: "Buat Booking", href: "/kirim" }
                : undefined
          }
        />
      ) : (
        <>
          {/* Kartu untuk layar kecil */}
          <ul className="grid gap-3 md:hidden">
            {shipments.map((shipment) => (
              <li key={shipment.id}>
                <ShipmentCard shipment={shipment} />
              </li>
            ))}
          </ul>

          {/* Tabel untuk layar lebar */}
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Resi</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Berat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <Link
                        href={`/kirim/${shipment.trackingNumber}`}
                        className="text-primary font-mono text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {shipment.trackingNumber}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {getServiceMeta(shipment.serviceType).label}
                      </p>
                    </TableCell>
                    <TableCell>{shipment.destinationName}</TableCell>
                    <TableCell>
                      <p className="text-sm">{shipment.recipientName}</p>
                      <p className="text-muted-foreground text-xs">
                        {shipment.recipientCity}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatWeight(shipment.chargeableWeight)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={shipment.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatRupiah(shipment.totalAmount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right whitespace-nowrap">
                      {formatDateShort(shipment.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Navigasi halaman"
              className="flex items-center justify-between gap-3"
            >
              <Button
                asChild={page > 1}
                variant="outline"
                size="sm"
                disabled={page <= 1}
              >
                {page > 1 ? (
                  <Link href={pageHref(page - 1)}>Sebelumnya</Link>
                ) : (
                  <span>Sebelumnya</span>
                )}
              </Button>

              <p className="text-muted-foreground text-sm">
                Halaman {page} dari {totalPages}
              </p>

              <Button
                asChild={page < totalPages}
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
              >
                {page < totalPages ? (
                  <Link href={pageHref(page + 1)}>Berikutnya</Link>
                ) : (
                  <span>Berikutnya</span>
                )}
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
