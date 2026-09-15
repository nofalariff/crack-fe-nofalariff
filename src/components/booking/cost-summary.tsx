"use client"

import { useEffect, useState, useTransition } from "react"
import { Info, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { estimateRateAction } from "@/lib/actions/rates"
import { formatEstimatedDays, formatRupiah, formatWeight } from "@/lib/format"
import type { RateCalculation } from "@/types/api"

/**
 * Ringkasan biaya yang ikut terlihat di seluruh langkah booking (PRD §11.4).
 *
 * Selalu ditandai sebagai estimasi karena berat final ditentukan saat
 * penimbangan di gudang, dan angka yang mengikat tetap dihitung backend.
 */
export function CostSummary({
  serviceType,
  destinationCode,
  weight,
}: {
  serviceType: string
  destinationCode: string
  weight: string
}) {
  // Hasil disimpan bersama kombinasi input yang menghasilkannya. Dengan begitu
  // hasil lama otomatis dianggap kedaluwarsa saat input berubah — tanpa perlu
  // mengosongkan state dari dalam effect, yang memicu render berantai.
  const inputKey = `${serviceType}|${destinationCode}|${weight}`
  const [entry, setEntry] = useState<{
    key: string
    rate: RateCalculation | null
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const rate = entry?.key === inputKey ? entry.rate : null

  useEffect(() => {
    const parsedWeight = Number(weight)

    if (
      !serviceType ||
      !destinationCode ||
      !parsedWeight ||
      parsedWeight <= 0
    ) {
      return
    }

    const key = `${serviceType}|${destinationCode}|${weight}`

    // Tunda sebentar agar tidak memanggil server pada setiap ketikan.
    const timer = setTimeout(() => {
      startTransition(async () => {
        const { result } = await estimateRateAction({
          serviceType,
          destinationCode,
          weight: parsedWeight,
        })
        setEntry({ key, rate: result })
      })
    }, 400)

    return () => clearTimeout(timer)
  }, [serviceType, destinationCode, weight])

  return (
    <Card className="lg:sticky lg:top-22">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Ringkasan biaya
          {isPending && (
            <Loader2
              className="text-muted-foreground size-4 animate-spin"
              aria-label="Menghitung ulang"
            />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {rate ? (
          <>
            <p className="text-muted-foreground text-sm">
              {rate.destinationName} · {formatEstimatedDays(rate.estimatedDays)}
            </p>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Berat dikenakan</dt>
                <dd>{formatWeight(rate.chargeableWeight)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Harga per kg</dt>
                <dd>{formatRupiah(rate.pricePerKg)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Biaya dasar</dt>
                <dd>{formatRupiah(rate.baseFee)}</dd>
              </div>
            </dl>

            <div className="flex items-baseline justify-between gap-4 border-t pt-4">
              <span className="text-sm font-medium">Total estimasi</span>
              <span className="text-xl font-semibold">
                {formatRupiah(rate.total)}
              </span>
            </div>

            <Alert>
              <Info aria-hidden />
              <AlertDescription>
                Estimasi. Tagihan final mengikuti hasil penimbangan di gudang.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Pilih layanan, tujuan, dan berat barang untuk melihat estimasi
            biaya.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
