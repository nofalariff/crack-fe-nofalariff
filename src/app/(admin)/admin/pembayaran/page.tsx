import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Wallet } from "lucide-react"

import { PaymentReview } from "@/components/admin/payment-review"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PaginationNav } from "@/components/shared/pagination-nav"
import { Button } from "@/components/ui/button"
import { getPaymentQueue } from "@/lib/api/admin"
import type { PaymentRecordStatus } from "@/types/api"

export const metadata: Metadata = { title: "Verifikasi Pembayaran" }

const TABS: Array<{ value: PaymentRecordStatus | "ALL"; label: string }> = [
  { value: "WAITING_VERIFICATION", label: "Menunggu Verifikasi" },
  { value: "VERIFIED", label: "Terverifikasi" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "ALL", label: "Semua" },
]

export default async function AdminPembayaranPage({
  searchParams,
}: PageProps<"/admin/pembayaran">) {
  const params = await searchParams

  const status =
    typeof params.status === "string"
      ? (params.status as PaymentRecordStatus | "ALL")
      : "WAITING_VERIFICATION"
  const page = Number(typeof params.page === "string" ? params.page : 1) || 1

  const { data: payments, meta } = await getPaymentQueue({
    status,
    page,
    limit: 10,
  })

  return (
    <>
      <PageHeader
        title="Verifikasi Pembayaran"
        description="Antrean bukti transfer, yang terlama diperiksa lebih dulu."
      />

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((tab) => {
          const active = status === tab.value
          return (
            <Button
              key={tab.value}
              asChild
              size="sm"
              variant={active ? "default" : "outline"}
            >
              <Link
                href={`/admin/pembayaran?status=${tab.value}`}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </Link>
            </Button>
          )
        })}
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={status === "WAITING_VERIFICATION" ? CheckCircle2 : Wallet}
          title={
            status === "WAITING_VERIFICATION"
              ? "Antrean bersih"
              : "Tidak ada data"
          }
          description={
            status === "WAITING_VERIFICATION"
              ? "Tidak ada bukti transfer yang menunggu diperiksa. Bukti baru akan otomatis muncul di sini."
              : "Belum ada pembayaran dengan status ini."
          }
        />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {meta?.total ?? payments.length} data pada tab ini.
          </p>

          <ul className="space-y-4">
            {payments.map((payment) => (
              <li key={payment.paymentId}>
                <PaymentReview item={payment} />
              </li>
            ))}
          </ul>

          <PaginationNav
            page={page}
            totalPages={meta?.totalPages ?? 1}
            basePath="/admin/pembayaran"
            params={params}
          />
        </>
      )}
    </>
  )
}
