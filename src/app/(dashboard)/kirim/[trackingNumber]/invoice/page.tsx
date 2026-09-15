import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, Upload, XCircle } from "lucide-react"

import { PrintButton } from "@/components/shared/print-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getInvoice } from "@/lib/api/endpoints"
import { ApiError } from "@/lib/api/errors"
import { getServiceMeta } from "@/lib/constants/service-type"
import { PAYMENT_STATUS_LABEL } from "@/lib/constants/shipment-status"
import { formatDateTimeWIB, formatRupiah, formatWeight } from "@/lib/format"

export async function generateMetadata({
  params,
}: PageProps<"/kirim/[trackingNumber]/invoice">): Promise<Metadata> {
  const { trackingNumber } = await params
  return { title: `Invoice ${trackingNumber}` }
}

export default async function InvoicePage({
  params,
  searchParams,
}: PageProps<"/kirim/[trackingNumber]/invoice">) {
  const [{ trackingNumber }, query] = await Promise.all([params, searchParams])

  const invoice = await getInvoice(trackingNumber).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  })

  const service = getServiceMeta(invoice.serviceType)
  const justUploaded = query.bukti === "terkirim"
  const latestPayment = invoice.payments[0]
  const isPaid = invoice.paymentStatus === "PAID"

  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/kirim/${invoice.trackingNumber}`}>
            <ArrowLeft aria-hidden />
            Kembali ke detail kiriman
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <PrintButton label="Cetak / Simpan PDF" />
          {!isPaid && (
            <Button asChild>
              <Link href={`/kirim/${invoice.trackingNumber}/bayar`}>
                <Upload aria-hidden />
                Unggah Bukti Transfer
              </Link>
            </Button>
          )}
        </div>
      </div>

      {justUploaded && (
        <Alert className="no-print">
          <CheckCircle2 aria-hidden />
          <AlertTitle>Bukti transfer terkirim</AlertTitle>
          <AlertDescription>
            Tim kami akan memverifikasi pembayaran Anda pada jam kerja. Status
            kiriman otomatis berubah setelah pembayaran diverifikasi.
          </AlertDescription>
        </Alert>
      )}

      {latestPayment?.status === "REJECTED" && (
        <Alert variant="destructive" className="no-print">
          <XCircle aria-hidden />
          <AlertTitle>Bukti transfer ditolak</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {latestPayment.rejectionReason ??
                "Bukti transfer yang Anda unggah belum dapat kami terima."}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={`/kirim/${invoice.trackingNumber}/bayar`}>
                Unggah ulang bukti transfer
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {latestPayment?.status === "WAITING_VERIFICATION" && (
        <Alert className="no-print">
          <Clock aria-hidden />
          <AlertTitle>Menunggu verifikasi admin</AlertTitle>
          <AlertDescription>
            Bukti transfer Anda sudah kami terima pada{" "}
            {formatDateTimeWIB(latestPayment.createdAt)} dan sedang diperiksa.
          </AlertDescription>
        </Alert>
      )}

      {/* Area yang ikut tercetak */}
      <Card className="print-area">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl leading-snug font-medium">
                Invoice
              </h1>
              <p className="mt-1 font-mono text-sm">{invoice.trackingNumber}</p>
            </div>
            <div className="text-sm sm:text-right">
              <p className="font-semibold">LogiSend</p>
              <p className="text-muted-foreground">
                Kargo Udara Port to Port &amp; Port to Door
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p className="font-medium">Ditagihkan kepada</p>
              <p>{invoice.customerName}</p>
              <p className="text-muted-foreground">{invoice.customerEmail}</p>
            </div>
            <div className="space-y-1 text-sm sm:text-right">
              <p>
                <span className="text-muted-foreground">Tanggal terbit: </span>
                {formatDateTimeWIB(invoice.issuedAt)}
              </p>
              <p>
                <span className="text-muted-foreground">Batas bayar: </span>
                {formatDateTimeWIB(invoice.dueAt)}
              </p>
              <p>
                <span className="text-muted-foreground">Status: </span>
                <span className="font-medium">
                  {PAYMENT_STATUS_LABEL[invoice.paymentStatus]}
                </span>
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-medium">Rincian tagihan</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Layanan</dt>
                <dd>
                  {service.label} — {invoice.destinationName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Berat dikenakan</dt>
                <dd>{formatWeight(invoice.chargeableWeight)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Harga per kg × berat dikenakan
                </dt>
                <dd>{formatRupiah(invoice.weightFee)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Biaya dasar</dt>
                <dd>{formatRupiah(invoice.baseFee)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-4 border-t pt-4">
              <span className="font-medium">Total tagihan</span>
              <span className="text-2xl font-semibold">
                {formatRupiah(invoice.totalAmount)}
              </span>
            </div>
          </div>

          {!isPaid && (
            <>
              <Separator />
              <div>
                <h2 className="text-sm font-medium">Instruksi pembayaran</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Transfer sesuai total tagihan ke rekening berikut, lalu unggah
                  bukti transfernya.
                </p>

                <dl className="mt-3 rounded-lg border p-4 text-sm">
                  <div className="flex justify-between gap-4 py-1">
                    <dt className="text-muted-foreground">Bank</dt>
                    <dd className="font-medium">
                      {invoice.bankAccount.bankName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-1">
                    <dt className="text-muted-foreground">Nomor rekening</dt>
                    <dd className="font-mono font-medium">
                      {invoice.bankAccount.accountNumber}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-1">
                    <dt className="text-muted-foreground">Atas nama</dt>
                    <dd className="font-medium">
                      {invoice.bankAccount.accountHolder}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}

          {invoice.payments.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-sm font-medium">Riwayat pembayaran</h2>
                <ul className="mt-3 divide-y rounded-lg border">
                  {invoice.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {formatRupiah(payment.claimedAmount)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {payment.senderAccountName} ·{" "}
                          {formatDateTimeWIB(payment.createdAt)}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {payment.status === "VERIFIED"
                          ? "Terverifikasi"
                          : payment.status === "REJECTED"
                            ? "Ditolak"
                            : "Menunggu verifikasi"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <p className="text-muted-foreground text-xs">
            Dokumen ini dibuat otomatis oleh sistem LogiSend dan sah tanpa tanda
            tangan.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
