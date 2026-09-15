import type { Metadata } from "next"
import Link from "next/link"
import { PackagePlus, PackageSearch } from "lucide-react"

import { AdminShipmentFilters } from "@/components/admin/admin-shipment-filters"
import { AdminShipmentTable } from "@/components/admin/shipment-table"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PaginationNav } from "@/components/shared/pagination-nav"
import { Button } from "@/components/ui/button"
import { getAdminRoutes, getAdminShipments } from "@/lib/api/admin"
import type {
  ServiceType,
  ShipmentPaymentStatus,
  ShipmentStatus,
} from "@/types/api"

export const metadata: Metadata = { title: "Kiriman" }

const PAGE_SIZE = 20

export default async function AdminKirimanPage({
  searchParams,
}: PageProps<"/admin/kiriman">) {
  const params = await searchParams

  const readParam = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined

  const page = Number(readParam("page") ?? 1) || 1

  const [{ data: shipments, meta }, routes] = await Promise.all([
    getAdminShipments({
      page,
      limit: PAGE_SIZE,
      status: readParam("status") as ShipmentStatus | undefined,
      serviceType: readParam("serviceType") as ServiceType | undefined,
      destinationCode: readParam("destinationCode"),
      paymentStatus: readParam("paymentStatus") as
        ShipmentPaymentStatus | undefined,
      search: readParam("search"),
      dateFrom: readParam("dateFrom"),
      dateTo: readParam("dateTo"),
    }),
    getAdminRoutes(),
  ])

  const hasFilter = [
    "status",
    "serviceType",
    "destinationCode",
    "paymentStatus",
    "search",
    "dateFrom",
    "dateTo",
  ].some((key) => readParam(key))

  return (
    <>
      <PageHeader
        title="Kiriman"
        description={
          meta
            ? `${meta.total} kiriman cocok dengan filter saat ini.`
            : "Seluruh kiriman LogiSend."
        }
        action={
          <Button asChild>
            <Link href="/admin/kiriman/baru">
              <PackagePlus aria-hidden />
              Buat Kiriman
            </Link>
          </Button>
        }
      />

      <AdminShipmentFilters routes={routes} />

      {shipments.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={
            hasFilter ? "Tidak ada kiriman yang cocok" : "Belum ada kiriman"
          }
          description={
            hasFilter
              ? "Longgarkan atau hapus filter untuk melihat kiriman lainnya."
              : "Kiriman yang dibuat customer maupun admin akan muncul di sini."
          }
          action={
            hasFilter
              ? { label: "Hapus filter", href: "/admin/kiriman" }
              : { label: "Buat Kiriman", href: "/admin/kiriman/baru" }
          }
        />
      ) : (
        <>
          <AdminShipmentTable shipments={shipments} />

          <PaginationNav
            page={page}
            totalPages={meta?.totalPages ?? 1}
            basePath="/admin/kiriman"
            params={params}
          />
        </>
      )}
    </>
  )
}
