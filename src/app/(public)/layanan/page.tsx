import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getRoutes } from "@/lib/api/endpoints"
import {
  ORIGIN,
  SERVICE_TYPES,
  getServiceMeta,
} from "@/lib/constants/service-type"
import { formatEstimatedDays } from "@/lib/format"

export const metadata: Metadata = {
  title: "Layanan Pengiriman",
  description:
    "Perbedaan layanan Port to Port dan Port to Door LogiSend beserta daftar tujuan yang dilayani dari Bandara Soekarno-Hatta.",
}

export default async function LayananPage() {
  const routes = await getRoutes()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Layanan Pengiriman
      </h1>
      <p className="text-muted-foreground mt-3">
        Seluruh pengiriman LogiSend berangkat dari counter kargo {ORIGIN.name} (
        {ORIGIN.code}), {ORIGIN.city}.
      </p>

      <Alert className="mt-6">
        <Info aria-hidden />
        <AlertTitle>Barang diantar sendiri ke gudang</AlertTitle>
        <AlertDescription>
          Untuk saat ini LogiSend belum melayani penjemputan barang. Setelah
          booking dibuat dan pembayaran diverifikasi, silakan antar barang ke
          counter kargo kami di {ORIGIN.code}.
        </AlertDescription>
      </Alert>

      {SERVICE_TYPES.map((serviceType) => {
        const meta = getServiceMeta(serviceType)
        const Icon = meta.icon
        const serviceRoutes = routes.filter(
          (route) => route.serviceType === serviceType
        )

        return (
          <section key={serviceType} className="mt-12">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {meta.label}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {meta.shortLabel}
                </p>
              </div>
            </div>

            <p className="mt-4">{meta.description}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              {meta.endpointNote}
            </p>

            <div className="mt-5 overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Wilayah</TableHead>
                    <TableHead className="text-right">Estimasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">
                        {route.destinationName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {route.destinationRegion}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatEstimatedDays(route.estimatedDays)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )
      })}

      <div className="bg-muted/30 mt-12 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Ingin tahu biayanya?</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Hitung estimasi ongkos kirim tanpa perlu membuat akun terlebih dahulu.
        </p>
        <Button asChild className="mt-4">
          <Link href="/cek-ongkir">
            Cek Ongkir
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  )
}
