"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Info, Tag } from "lucide-react"
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
import { saveRateAction, type AdminActionState } from "@/lib/actions/admin"
import { formatRupiah } from "@/lib/format"
import type { AdminRoute } from "@/types/api"

/** Atur tarif satu rute (FR-RATE-04). */
export function RateDialog({ route }: { route: AdminRoute }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<AdminActionState>()
  const [pricePerKg, setPricePerKg] = useState(String(route.pricePerKg))
  const [minWeight, setMinWeight] = useState(String(route.minChargeableWeight))
  const [baseFee, setBaseFee] = useState(String(route.baseFee))

  // Contoh perhitungan agar dampak tarif langsung terbayang.
  const sampleWeight = 10
  const chargeable = Math.max(sampleWeight, Number(minWeight) || 0)
  const sampleTotal =
    Math.ceil(
      (chargeable * (Number(pricePerKg) || 0) + (Number(baseFee) || 0)) / 100
    ) * 100

  async function handleSubmit(formData: FormData) {
    const result = await saveRateAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Tarif diperbarui.")
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
        <Button variant="outline" size="sm">
          <Tag aria-hidden />
          Atur Tarif
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="routeId" value={route.id} />

          <DialogHeader>
            <DialogTitle>Tarif {route.destinationName}</DialogTitle>
            <DialogDescription>
              Atur komponen tarif untuk rute ini.
            </DialogDescription>
          </DialogHeader>

          {state?.message && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info aria-hidden />
            <AlertDescription>
              Tarif baru hanya berlaku untuk booking berikutnya. Kiriman yang
              sudah terbit mempertahankan tarif saat dibuat, sehingga tagihannya
              tidak berubah.
            </AlertDescription>
          </Alert>

          <TextField
            name="pricePerKg"
            label="Harga per kg (Rp)"
            type="number"
            min="1"
            inputMode="numeric"
            required
            value={pricePerKg}
            onChange={(event) => setPricePerKg(event.target.value)}
            error={errors.pricePerKg}
          />

          <TextField
            name="minChargeableWeight"
            label="Berat minimum dikenakan (kg)"
            type="number"
            min="1"
            inputMode="numeric"
            required
            value={minWeight}
            onChange={(event) => setMinWeight(event.target.value)}
            description="Kiriman lebih ringan dari ini tetap ditagih pada berat minimum."
            error={errors.minChargeableWeight}
          />

          <TextField
            name="baseFee"
            label="Biaya dasar (Rp)"
            type="number"
            min="0"
            inputMode="numeric"
            required
            value={baseFee}
            onChange={(event) => setBaseFee(event.target.value)}
            description="Biaya tetap per kiriman, misalnya administrasi surat muatan."
            error={errors.baseFee}
          />

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">Contoh perhitungan</p>
            <p className="text-muted-foreground mt-1">
              Kiriman {sampleWeight} kg ditagih {chargeable} kg ={" "}
              {formatRupiah(sampleTotal)}.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <SubmitButton pendingText="Menyimpan…">Simpan Tarif</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
