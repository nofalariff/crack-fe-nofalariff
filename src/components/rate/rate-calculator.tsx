"use client"

import { useActionState, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Calculator, Info, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { calculateRateAction, type RateState } from "@/lib/actions/rates"
import { SERVICE_TYPES, getServiceMeta } from "@/lib/constants/service-type"
import { formatEstimatedDays, formatRupiah, formatWeight } from "@/lib/format"
import type { Route, ServiceType } from "@/types/api"

/**
 * Form kalkulator ongkir.
 *
 * Daftar tujuan datang dari API dan difilter mengikuti layanan yang dipilih —
 * tidak ada kode bandara atau zona yang ditulis di komponen ini (PRD §5.3).
 */
export function RateCalculator({ routes }: { routes: Route[] }) {
  const [state, formAction, isPending] = useActionState<
    RateState | undefined,
    FormData
  >(calculateRateAction, undefined)

  const [serviceType, setServiceType] = useState<ServiceType>(
    (state?.values?.serviceType as ServiceType) || "PORT_TO_PORT"
  )
  const [destinationCode, setDestinationCode] = useState(
    state?.values?.destinationCode ?? ""
  )

  const availableRoutes = useMemo(
    () => routes.filter((route) => route.serviceType === serviceType),
    [routes, serviceType]
  )

  function handleServiceChange(value: string) {
    setServiceType(value as ServiceType)
    // Tujuan lama belum tentu tersedia pada layanan baru.
    setDestinationCode("")
  }

  const result = state?.result

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>Hitung estimasi ongkir</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <Field data-invalid={!!state?.fieldErrors?.serviceType}>
              <FieldLabel htmlFor="serviceType">Jenis layanan</FieldLabel>
              <Select
                name="serviceType"
                value={serviceType}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger id="serviceType" className="w-full">
                  <SelectValue placeholder="Pilih layanan" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => {
                    const meta = getServiceMeta(type)
                    return (
                      <SelectItem key={type} value={type}>
                        {meta.label} — {meta.shortLabel}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FieldDescription>
                {getServiceMeta(serviceType).endpointNote}
              </FieldDescription>
              <FieldError>{state?.fieldErrors?.serviceType}</FieldError>
            </Field>

            <Field data-invalid={!!state?.fieldErrors?.destinationCode}>
              <FieldLabel htmlFor="destinationCode">
                Tujuan pengiriman
              </FieldLabel>
              <Select
                name="destinationCode"
                value={destinationCode}
                onValueChange={setDestinationCode}
              >
                <SelectTrigger id="destinationCode" className="w-full">
                  <SelectValue placeholder="Pilih tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoutes.map((route) => (
                    <SelectItem key={route.id} value={route.destinationCode}>
                      {route.destinationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{state?.fieldErrors?.destinationCode}</FieldError>
            </Field>

            <Field data-invalid={!!state?.fieldErrors?.weight}>
              <FieldLabel htmlFor="weight">Berat barang (kg)</FieldLabel>
              <Input
                id="weight"
                name="weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0.1"
                placeholder="Contoh: 2.5"
                defaultValue={state?.values?.weight}
                aria-describedby="weight-description"
              />
              <FieldDescription id="weight-description">
                Berat dibulatkan ke atas ke kelipatan 1 kg dan mengikuti berat
                minimum rute.
              </FieldDescription>
              <FieldError>{state?.fieldErrors?.weight}</FieldError>
            </Field>

            {state?.message && (
              <Alert variant="destructive">
                <Info aria-hidden />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Calculator aria-hidden />
              )}
              Hitung Ongkir
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {result ? (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Estimasi biaya</CardTitle>
              <p className="text-muted-foreground text-sm">
                {result.destinationName} ·{" "}
                {formatEstimatedDays(result.estimatedDays)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Berat diinput</dt>
                  <dd>{formatWeight(result.inputWeight)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Berat dikenakan</dt>
                  <dd className="font-medium">
                    {formatWeight(result.chargeableWeight)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Harga per kg</dt>
                  <dd>{formatRupiah(result.pricePerKg)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Biaya berat</dt>
                  <dd>{formatRupiah(result.weightFee)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Biaya dasar</dt>
                  <dd>{formatRupiah(result.baseFee)}</dd>
                </div>
              </dl>

              <div className="flex items-baseline justify-between gap-4 border-t pt-4">
                <span className="text-sm font-medium">Total estimasi</span>
                <span className="text-xl font-semibold">
                  {formatRupiah(result.total)}
                </span>
              </div>

              <Alert>
                <Info aria-hidden />
                <AlertDescription>
                  Angka ini <strong>estimasi</strong>. Biaya final ditentukan
                  setelah barang ditimbang ulang di gudang kami.
                </AlertDescription>
              </Alert>

              <Button asChild className="w-full">
                <Link
                  href={{
                    pathname: "/kirim",
                    query: {
                      serviceType: result.serviceType,
                      destinationCode: result.destinationCode,
                      weight: String(result.inputWeight),
                    },
                  }}
                >
                  Lanjut Booking
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Isi form di samping untuk melihat estimasi biaya pengiriman.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
