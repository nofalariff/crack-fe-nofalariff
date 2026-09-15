import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Info } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { EditShipmentForm } from "@/components/shipment/edit-shipment-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getShipment } from "@/lib/api/endpoints"
import { ApiError } from "@/lib/api/errors"
import { canCustomerEdit } from "@/lib/constants/shipment-status"

export async function generateMetadata({
  params,
}: PageProps<"/kirim/[trackingNumber]/ubah">): Promise<Metadata> {
  const { trackingNumber } = await params
  return { title: `Ubah ${trackingNumber}` }
}

export default async function UbahKirimanPage({
  params,
}: PageProps<"/kirim/[trackingNumber]/ubah">) {
  const { trackingNumber } = await params

  const shipment = await getShipment(trackingNumber).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  })

  // Setelah barang diterima di gudang, data kiriman dikunci (PRD §8.5).
  if (!canCustomerEdit(shipment.status)) {
    redirect(`/kirim/${trackingNumber}`)
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={`/kirim/${trackingNumber}`}>
          <ArrowLeft aria-hidden />
          Kembali ke detail kiriman
        </Link>
      </Button>

      <PageHeader
        title="Ubah Data Kiriman"
        description={`Untuk kiriman ${trackingNumber}`}
      />

      <Alert>
        <Info aria-hidden />
        <AlertTitle>Yang tidak bisa diubah sendiri</AlertTitle>
        <AlertDescription>
          Berat, jenis layanan, dan tujuan memengaruhi tagihan sehingga
          perubahannya harus lewat tim operasional kami. Bila salah satunya
          keliru, batalkan kiriman ini selagi masih menunggu pembayaran, lalu
          buat booking baru.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Data penerima &amp; barang</CardTitle>
        </CardHeader>
        <CardContent>
          <EditShipmentForm shipment={shipment} />
        </CardContent>
      </Card>
    </>
  )
}
