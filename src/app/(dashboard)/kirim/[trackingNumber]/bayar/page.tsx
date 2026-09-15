import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PaymentProofForm } from "@/components/payment/payment-proof-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInvoice, getShipment } from "@/lib/api/endpoints"
import { ApiError } from "@/lib/api/errors"
import { formatDateInput, formatRupiah } from "@/lib/format"

export async function generateMetadata({
  params,
}: PageProps<"/kirim/[trackingNumber]/bayar">): Promise<Metadata> {
  const { trackingNumber } = await params
  return { title: `Bayar ${trackingNumber}` }
}

export default async function BayarPage({
  params,
}: PageProps<"/kirim/[trackingNumber]/bayar">) {
  const { trackingNumber } = await params

  const [shipment, invoice] = await Promise.all([
    getShipment(trackingNumber).catch((error) => {
      if (error instanceof ApiError && error.status === 404) notFound()
      throw error
    }),
    getInvoice(trackingNumber).catch((error) => {
      if (error instanceof ApiError && error.status === 404) notFound()
      throw error
    }),
  ])

  // Halaman ini tidak relevan untuk kiriman yang sudah lunas atau dibatalkan.
  if (shipment.paymentStatus === "PAID" || shipment.status === "CANCELLED") {
    redirect(`/kirim/${trackingNumber}/invoice`)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/kirim/${trackingNumber}/invoice`}>
            <ArrowLeft aria-hidden />
            Kembali ke invoice
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Unggah Bukti Transfer"
        description={`Untuk kiriman ${trackingNumber}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Data pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentProofForm
              shipmentId={shipment.id}
              trackingNumber={trackingNumber}
              totalAmount={invoice.outstandingAmount || invoice.totalAmount}
              defaultSenderName={invoice.customerName}
              todayInput={formatDateInput(new Date())}
            />
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-22 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Transfer ke</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="space-y-2">
              <div>
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="font-medium">{invoice.bankAccount.bankName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Nomor rekening</dt>
                <dd className="font-mono font-medium">
                  {invoice.bankAccount.accountNumber}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Atas nama</dt>
                <dd className="font-medium">
                  {invoice.bankAccount.accountHolder}
                </dd>
              </div>
            </dl>

            <div className="border-t pt-4">
              <p className="text-muted-foreground">Total tagihan</p>
              <p className="text-xl font-semibold">
                {formatRupiah(invoice.totalAmount)}
              </p>
            </div>

            <p className="text-muted-foreground text-xs">
              Setelah bukti diunggah, tim kami memverifikasi pembayaran pada jam
              kerja. Status kiriman berubah otomatis setelah terverifikasi.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
