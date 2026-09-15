"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Scale } from "lucide-react"
import { toast } from "sonner"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { correctWeightAction, type AdminActionState } from "@/lib/actions/admin"
import { formatRupiah, formatWeight } from "@/lib/format"
import type { AdminShipmentDetail } from "@/types/api"

/**
 * Koreksi berat setelah penimbangan di gudang (FR-PAY-05).
 *
 * Selisih tagihan dihitung dan diperlihatkan sebelum disimpan, supaya admin
 * tahu persis dampaknya terhadap customer. Perhitungan memakai snapshot tarif
 * milik kiriman — bukan tarif berjalan — sehingga koreksi berat tidak pernah
 * diam-diam mengubah harga per kg.
 */
export function WeightCorrectionDialog({
  shipment,
}: {
  shipment: AdminShipmentDetail
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [weight, setWeight] = useState(
    String(shipment.actualWeight ?? shipment.declaredWeight)
  )
  const [state, setState] = useState<AdminActionState>()

  const parsedWeight = Number(weight)
  const validPreview = Number.isFinite(parsedWeight) && parsedWeight > 0

  // Cerminan rumus PRD §8.2 memakai snapshot tarif kiriman ini.
  const minWeight = Math.max(
    1,
    Math.round(
      (shipment.totalAmount - shipment.baseFeeSnapshot) /
        Math.max(1, shipment.pricePerKgSnapshot)
    )
  )
  const previewChargeable = validPreview
    ? Math.max(Math.ceil(parsedWeight), 1)
    : shipment.chargeableWeight
  const previewTotal = validPreview
    ? Math.ceil(
        (previewChargeable * shipment.pricePerKgSnapshot +
          shipment.baseFeeSnapshot) /
          100
      ) * 100
    : shipment.totalAmount
  const difference = previewTotal - shipment.totalAmount

  async function handleSubmit(formData: FormData) {
    const result = await correctWeightAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Berat diperbarui.")
      setState(undefined)
      setOpen(false)
      router.refresh()
      return
    }

    setState(result)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setState(undefined)
  }

  const errors = state?.fieldErrors ?? {}

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Scale aria-hidden />
          Koreksi Berat
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="shipmentId" value={shipment.id} />
          <input
            type="hidden"
            name="trackingNumber"
            value={shipment.trackingNumber}
          />

          <DialogHeader>
            <DialogTitle>Koreksi Berat Timbang</DialogTitle>
            <DialogDescription>
              Masukkan berat hasil penimbangan di gudang. Tagihan dihitung ulang
              memakai tarif yang berlaku saat kiriman dibuat.
            </DialogDescription>
          </DialogHeader>

          {state?.message && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <dl className="bg-muted/50 space-y-1.5 rounded-lg p-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Berat dideklarasikan</dt>
              <dd>{formatWeight(shipment.declaredWeight)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Berat dikenakan saat ini
              </dt>
              <dd>{formatWeight(shipment.chargeableWeight)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tagihan saat ini</dt>
              <dd>{formatRupiah(shipment.totalAmount)}</dd>
            </div>
          </dl>

          <TextField
            name="actualWeight"
            label="Berat hasil timbang (kg)"
            type="number"
            step="0.1"
            min="0.1"
            inputMode="decimal"
            required
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            description={`Berat minimum rute ini sekitar ${minWeight} kg.`}
            error={errors.actualWeight}
          />

          {/* Dampak tagihan diperlihatkan sebelum admin menekan simpan */}
          {validPreview && difference !== 0 && (
            <div
              className={
                difference > 0
                  ? "border-warning/40 bg-warning-soft rounded-lg border p-3 text-sm"
                  : "border-info/40 bg-info-soft rounded-lg border p-3 text-sm"
              }
            >
              <p className="font-medium">
                {difference > 0
                  ? `Tagihan naik ${formatRupiah(difference)}`
                  : `Tagihan turun ${formatRupiah(Math.abs(difference))}`}
              </p>
              <p className="text-muted-foreground mt-1">
                Perkiraan total baru {formatRupiah(previewTotal)}.{" "}
                {difference > 0
                  ? "Kekurangan akan ditandai pada kiriman dan terlihat customer; pengiriman tetap dapat dilanjutkan."
                  : "Kelebihan bayar dicatat untuk ditindaklanjuti secara manual."}
              </p>
            </div>
          )}

          <TextField
            name="notes"
            label="Catatan"
            multiline
            rows={2}
            placeholder="Opsional — contoh: kemasan ditambah pelindung kayu"
            error={errors.notes}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <SubmitButton pendingText="Menyimpan…">
              Simpan Berat Baru
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
