"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRightLeft } from "lucide-react"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateStatusAction, type AdminActionState } from "@/lib/actions/admin"
import {
  getAllowedTransitions,
  getStatusMeta,
  requiresDeliveredTo,
  requiresReason,
} from "@/lib/constants/shipment-status"
import type { AdminShipmentDetail, ShipmentStatus } from "@/types/api"

/**
 * Ubah status satu kiriman (FR-TRACK-02).
 *
 * Pilihan status dibatasi transisi yang sah menurut state machine PRD §8.3.
 * Ini demi kenyamanan — backend tetap menolak transisi tidak sah, dan
 * penolakannya ditampilkan apa adanya bila sampai terjadi (misalnya karena
 * status berubah di sela-sela oleh admin lain).
 */
export function StatusUpdateDialog({
  shipment,
}: {
  shipment: AdminShipmentDetail
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<ShipmentStatus | "">("")
  const [state, setState] = useState<AdminActionState>()

  const allowed = getAllowedTransitions(
    shipment.status,
    shipment.serviceType,
    shipment.previousStatus
  )

  async function handleSubmit(formData: FormData) {
    const result = await updateStatusAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Status diperbarui.")
      setState(undefined)
      setStatus("")
      setOpen(false)
      router.refresh()
      return
    }

    setState(result)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setState(undefined)
      setStatus("")
    }
  }

  if (allowed.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Kiriman ini sudah berstatus akhir — tidak ada perubahan status lanjutan.
      </p>
    )
  }

  const errors = state?.fieldErrors ?? {}
  const needsReason = status ? requiresReason(status) : false
  const needsDeliveredTo = status ? requiresDeliveredTo(status) : false

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <ArrowRightLeft aria-hidden />
          Ubah Status
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="shipmentId" value={shipment.id} />
          <input
            type="hidden"
            name="trackingNumber"
            value={shipment.trackingNumber}
          />

          <DialogHeader>
            <DialogTitle>Ubah Status Kiriman</DialogTitle>
            <DialogDescription>
              {shipment.trackingNumber} — saat ini{" "}
              <strong>{getStatusMeta(shipment.status).label}</strong>. Hanya
              status berikutnya yang sah yang dapat dipilih.
            </DialogDescription>
          </DialogHeader>

          {state?.message && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <Field data-invalid={!!errors.status}>
            <FieldLabel htmlFor="status-next">Status baru</FieldLabel>
            <Select
              name="status"
              value={status}
              onValueChange={(value) => setStatus(value as ShipmentStatus)}
            >
              <SelectTrigger id="status-next" className="w-full">
                <SelectValue placeholder="Pilih status berikutnya" />
              </SelectTrigger>
              <SelectContent>
                {allowed.map((next) => (
                  <SelectItem key={next} value={next}>
                    {getStatusMeta(next).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.status}</FieldError>
          </Field>

          {status && (
            <p className="text-muted-foreground bg-muted/60 rounded-md px-3 py-2 text-sm">
              {getStatusMeta(status).description}
            </p>
          )}

          {needsDeliveredTo && (
            <TextField
              name="deliveredTo"
              label="Diterima oleh"
              required
              placeholder="Nama orang yang menerima barang"
              description="Wajib dicatat sebagai bukti serah terima."
              error={errors.deliveredTo}
            />
          )}

          {needsReason && (
            <TextField
              name="reason"
              label="Alasan"
              multiline
              rows={3}
              required
              placeholder="Jelaskan kendalanya — alasan ini ikut terlihat customer"
              error={errors.reason}
            />
          )}

          <TextField
            name="location"
            label="Lokasi"
            placeholder="Opsional — contoh: Gudang kargo CGK"
            error={errors.location}
          />

          <TextField
            name="notes"
            label="Catatan"
            multiline
            rows={2}
            placeholder="Opsional — keterangan tambahan pada riwayat status"
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
              Simpan Perubahan
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
