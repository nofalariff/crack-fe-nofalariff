import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, UserRound } from "lucide-react"

import { PaymentReview } from "@/components/admin/payment-review"
import { StatusUpdateDialog } from "@/components/admin/status-update-dialog"
import { WeightCorrectionDialog } from "@/components/admin/weight-correction-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shipment/status-badge"
import { StatusTimeline } from "@/components/shipment/status-timeline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminShipment } from "@/lib/api/admin"
import { ApiError } from "@/lib/api/errors"
import { getServiceMeta } from "@/lib/constants/service-type"
import { PAYMENT_STATUS_LABEL } from "@/lib/constants/shipment-status"
import {
  formatDateTimeWIB,
  formatPhone,
  formatRupiah,
  formatWeight,
} from "@/lib/format"
import type { PaymentQueueItem } from "@/types/api"

export async function generateMetadata({
  params,
}: PageProps<"/admin/kiriman/[trackingNumber]">): Promise<Metadata> {
  const { trackingNumber } = await params
  return { title: `Kiriman ${trackingNumber}` }
}

export default async function AdminShipmentDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/kiriman/[trackingNumber]">) {
  const [{ trackingNumber }, query] = await Promise.all([params, searchParams])

  const shipment = await getAdminShipment(trackingNumber).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  })

  const service = getServiceMeta(shipment.serviceType)
  const justCreated = query.dibuat === "1"

  // Bentuk ulang pembayaran kiriman ini agar bisa memakai kartu tinjauan
  // yang sama dengan halaman antrean — satu komponen, satu perilaku.
  const paymentItems: PaymentQueueItem[] = shipment.payments.map((payment) => ({
    paymentId: payment.id,
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
    customerName: shipment.customerName,
    customerEmail: shipment.customerEmail,
    totalAmount: shipment.totalAmount,
    claimedAmount: payment.claimedAmount,
    difference: payment.claimedAmount - shipment.totalAmount,
    senderAccountName: payment.senderAccountName,
    transferDate: payment.transferDate,
    attachmentId: payment.attachmentId,
    attachmentName: payment.attachmentName,
    status: payment.status,
    submittedAt: payment.createdAt,
  }))

  const details: [string, string][] = [
    ["Jenis layanan", service.label],
    ["Tujuan", shipment.destinationName],
    ["Estimasi", `${shipment.estimatedDays} hari`],
    ["Berat dideklarasikan", formatWeight(shipment.declaredWeight)],
    [
      "Berat timbang gudang",
      shipment.actualWeight
        ? formatWeight(shipment.actualWeight)
        : "Belum ditimbang",
    ],
    ["Berat dikenakan", formatWeight(shipment.chargeableWeight)],
    ["Jumlah koli", String(shipment.totalColli)],
    ["Dibuat", formatDateTimeWIB(shipment.createdAt)],
    ["Diperbarui", formatDateTimeWIB(shipment.updatedAt)],
  ]

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/admin/kiriman">
          <ArrowLeft aria-hidden />
          Kembali ke daftar kiriman
        </Link>
      </Button>

      <PageHeader
        title={shipment.trackingNumber}
        description={`${service.label} · ${shipment.destinationName}`}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusUpdateDialog shipment={shipment} />
            <WeightCorrectionDialog shipment={shipment} />
          </div>
        }
      />

      {justCreated && (
        <p
          role="status"
          className="border-success/30 bg-success-soft text-success-foreground flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Kiriman berhasil dibuat. Nomor resi sudah terbit.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={shipment.status} />
        <span className="text-muted-foreground text-sm">
          Pembayaran: {PAYMENT_STATUS_LABEL[shipment.paymentStatus]}
        </span>
        {shipment.previousStatus && (
          <span className="text-muted-foreground text-sm">
            Sebelum tertahan: {shipment.previousStatus}
          </span>
        )}
      </div>

      {shipment.outstandingAmount > 0 && shipment.paymentStatus === "PAID" && (
        <p className="border-warning/40 bg-warning-soft text-warning-foreground rounded-lg border px-4 py-3 text-sm">
          Ada kekurangan bayar {formatRupiah(shipment.outstandingAmount)} akibat
          koreksi berat. Kiriman tetap dapat diproses.
        </p>
      )}

      {shipment.cancelReason && (
        <p className="border-danger/30 bg-danger-soft text-danger-foreground rounded-lg border px-4 py-3 text-sm">
          Alasan pembatalan: {shipment.cancelReason}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline events={shipment.events} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Customer belum mengunggah bukti pembayaran.
                </p>
              ) : (
                <ul className="space-y-4">
                  {paymentItems.map((payment) => (
                    <li key={payment.paymentId}>
                      <PaymentReview item={payment} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detail kiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                {details.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-3"
                  >
                    <dt className="text-muted-foreground text-sm">{label}</dt>
                    <dd className="text-sm sm:col-span-2">{value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-4 divide-y border-t pt-4">
                {shipment.items.map((item) => (
                  <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-sm">{item.description}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {item.quantity} koli · {formatWeight(item.weight)}
                      {item.declaredValue
                        ? ` · nilai ${formatRupiah(item.declaredValue)}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>

              {shipment.notes && (
                <p className="bg-muted/60 mt-4 rounded-md px-3 py-2 text-sm">
                  Catatan: {shipment.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{shipment.customerName}</p>
                <p className="text-muted-foreground">
                  {shipment.customerEmail}
                </p>
                <p className="text-muted-foreground">
                  {shipment.customerRole === "AGENT" ? "Agen" : "Perorangan"}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/pengguna/${shipment.customerId}`}>
                  <UserRound aria-hidden />
                  Lihat profil
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biaya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Berat dikenakan</dt>
                  <dd>{formatWeight(shipment.chargeableWeight)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Harga per kg</dt>
                  <dd>{formatRupiah(shipment.pricePerKgSnapshot)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Biaya dasar</dt>
                  <dd>{formatRupiah(shipment.baseFeeSnapshot)}</dd>
                </div>
              </dl>
              <div className="flex items-baseline justify-between gap-4 border-t pt-3">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-semibold">
                  {formatRupiah(shipment.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pengirim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{shipment.senderName}</p>
              <p className="text-muted-foreground">
                {formatPhone(shipment.senderPhone)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Penerima</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{shipment.recipientName}</p>
              <p className="text-muted-foreground">
                {formatPhone(shipment.recipientPhone)}
              </p>
              {shipment.recipientAddress && (
                <p className="text-muted-foreground">
                  {shipment.recipientAddress}
                </p>
              )}
              <p className="text-muted-foreground">
                {shipment.recipientCity}
                {shipment.recipientPostalCode
                  ? ` ${shipment.recipientPostalCode}`
                  : ""}
              </p>
              {shipment.deliveredTo && (
                <p className="bg-success-soft text-success-foreground mt-2 rounded-md px-3 py-2">
                  Diterima oleh {shipment.deliveredTo}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
