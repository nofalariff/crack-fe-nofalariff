import type { Metadata } from "next"
import { Info, Pencil } from "lucide-react"

import { RateDialog } from "@/components/admin/rate-dialog"
import { RouteDialog } from "@/components/admin/route-dialog"
import { RouteToggle } from "@/components/admin/route-toggle"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAdminRoutes } from "@/lib/api/admin"
import {
  ORIGIN,
  SERVICE_TYPES,
  getServiceMeta,
} from "@/lib/constants/service-type"
import { formatRupiah, formatWeight } from "@/lib/format"

export const metadata: Metadata = { title: "Rute & Tarif" }

export default async function AdminRutePage() {
  const routes = await getAdminRoutes()

  return (
    <>
      <PageHeader
        title="Rute & Tarif"
        description={`Seluruh pengiriman berangkat dari ${ORIGIN.name} (${ORIGIN.code}).`}
        action={<RouteDialog />}
      />

      <Alert>
        <Info aria-hidden />
        <AlertDescription>
          Perubahan tarif hanya berlaku untuk booking baru. Kiriman yang sudah
          terbit mempertahankan tarif saat dibuat, jadi tagihannya tidak ikut
          berubah. Rute yang masih dipakai kiriman berjalan hanya bisa
          dinonaktifkan, tidak dihapus.
        </AlertDescription>
      </Alert>

      {SERVICE_TYPES.map((serviceType) => {
        const meta = getServiceMeta(serviceType)
        const serviceRoutes = routes.filter(
          (route) => route.serviceType === serviceType
        )

        return (
          <Card key={serviceType}>
            <CardHeader>
              <CardTitle>{meta.label}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {meta.shortLabel} — {serviceRoutes.length} rute
              </p>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tujuan</TableHead>
                      <TableHead>Wilayah</TableHead>
                      <TableHead className="text-right">Estimasi</TableHead>
                      <TableHead className="text-right">Harga / kg</TableHead>
                      <TableHead className="text-right">Berat min.</TableHead>
                      <TableHead className="text-right">Biaya dasar</TableHead>
                      <TableHead className="text-right">
                        Kiriman aktif
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {serviceRoutes.map((route) => {
                      const rateUnset = route.pricePerKg <= 0

                      return (
                        <TableRow key={route.id}>
                          <TableCell>
                            <p className="text-sm font-medium">
                              {route.destinationName}
                            </p>
                            <p className="text-muted-foreground font-mono text-xs">
                              {route.destinationCode}
                            </p>
                          </TableCell>

                          <TableCell className="text-muted-foreground text-sm">
                            {route.destinationRegion}
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            {route.estimatedDays} hari
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            {rateUnset ? (
                              <span className="text-warning-foreground text-xs font-medium">
                                Belum diatur
                              </span>
                            ) : (
                              formatRupiah(route.pricePerKg)
                            )}
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            {formatWeight(route.minChargeableWeight)}
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            {formatRupiah(route.baseFee)}
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {route.activeShipmentCount}
                          </TableCell>

                          <TableCell>
                            <RouteToggle
                              routeId={route.id}
                              routeName={route.destinationName}
                              isActive={route.isActive}
                            />
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <RouteDialog
                                route={route}
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    <Pencil aria-hidden />
                                    <span className="sr-only">
                                      Ubah {route.destinationName}
                                    </span>
                                  </Button>
                                }
                              />
                              <RateDialog route={route} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}
