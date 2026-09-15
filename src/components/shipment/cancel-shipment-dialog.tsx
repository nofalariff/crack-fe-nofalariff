"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/shared/submit-button"
import {
  cancelShipmentAction,
  type ShipmentActionState,
} from "@/lib/actions/shipments"

/**
 * Pembatalan kiriman selalu lewat konfirmasi eksplisit (NFR-UX-05).
 * Tombolnya sendiri hanya dirender saat status masih mengizinkan (PRD §8.5).
 */
export function CancelShipmentDialog({
  shipmentId,
  trackingNumber,
}: {
  shipmentId: string
  trackingNumber: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Hasil aksi ditangani langsung di dalam form action, bukan lewat effect yang
  // mengamati state — menutup dialog adalah reaksi terhadap sebuah kejadian,
  // bukan sinkronisasi state.
  async function handleSubmit(formData: FormData) {
    const result: ShipmentActionState | undefined = await cancelShipmentAction(
      undefined,
      formData
    )

    if (result?.success) {
      toast.success(result.message ?? "Kiriman dibatalkan.")
      setOpen(false)
      router.refresh()
      return
    }

    if (result?.message) toast.error(result.message)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Ban aria-hidden />
          Batalkan
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={handleSubmit}>
          <input type="hidden" name="shipmentId" value={shipmentId} />
          <input type="hidden" name="trackingNumber" value={trackingNumber} />

          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan kiriman ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kiriman {trackingNumber} akan dibatalkan dan tidak dapat
              diaktifkan kembali. Nomor resi ini juga tidak dapat digunakan
              ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 space-y-2">
            <Label htmlFor="cancel-reason">Alasan pembatalan (opsional)</Label>
            <Textarea
              id="cancel-reason"
              name="reason"
              rows={3}
              placeholder="Contoh: barang batal dikirim"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Tidak jadi</AlertDialogCancel>
            <SubmitButton variant="destructive" pendingText="Membatalkan…">
              Ya, batalkan
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
