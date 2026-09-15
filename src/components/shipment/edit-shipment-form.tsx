"use client"

import { useActionState } from "react"
import { AlertCircle, Save } from "lucide-react"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  updateShipmentAction,
  type ShipmentActionState,
} from "@/lib/actions/shipments"
import { getServiceMeta } from "@/lib/constants/service-type"
import type { Shipment } from "@/types/api"

/**
 * Ubah data kiriman (FR-BOOK-04).
 *
 * Hanya kolom yang tidak memengaruhi tarif yang dapat diubah di sini. Perubahan
 * berat, layanan, atau tujuan memicu perhitungan ulang tagihan, sehingga harus
 * lewat tim operasional — dijelaskan langsung di form agar tidak mengejutkan.
 */
export function EditShipmentForm({ shipment }: { shipment: Shipment }) {
  const [state, formAction] = useActionState<
    ShipmentActionState | undefined,
    FormData
  >(updateShipmentAction, undefined)

  const errors = state?.fieldErrors ?? {}
  const service = getServiceMeta(shipment.serviceType)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="shipmentId" value={shipment.id} />
      <input
        type="hidden"
        name="trackingNumber"
        value={shipment.trackingNumber}
      />

      {state?.message && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="recipientName"
          label="Nama penerima"
          required
          defaultValue={shipment.recipientName}
          error={errors.recipientName}
        />
        <TextField
          name="recipientPhone"
          label="Nomor HP penerima"
          type="tel"
          required
          defaultValue={shipment.recipientPhone}
          error={errors.recipientPhone}
        />
      </div>

      <TextField
        name="recipientAddress"
        label={
          service.requiresFullAddress
            ? "Alamat lengkap penerima"
            : "Catatan alamat (opsional)"
        }
        multiline
        rows={3}
        required={service.requiresFullAddress}
        defaultValue={shipment.recipientAddress}
        error={errors.recipientAddress}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="recipientCity"
          label="Kota / kabupaten"
          required
          defaultValue={shipment.recipientCity}
          error={errors.recipientCity}
        />
        <TextField
          name="recipientPostalCode"
          label="Kode pos"
          placeholder="Opsional"
          defaultValue={shipment.recipientPostalCode ?? ""}
          error={errors.recipientPostalCode}
        />
      </div>

      <TextField
        name="itemDescription"
        label="Deskripsi isi barang"
        multiline
        rows={3}
        required
        defaultValue={shipment.items[0]?.description ?? ""}
        error={errors.itemDescription}
      />

      <TextField
        name="notes"
        label="Catatan untuk tim kami"
        multiline
        rows={2}
        defaultValue={shipment.notes ?? ""}
        error={errors.notes}
      />

      <SubmitButton pendingText="Menyimpan…">
        <Save aria-hidden />
        Simpan Perubahan
      </SubmitButton>
    </form>
  )
}
