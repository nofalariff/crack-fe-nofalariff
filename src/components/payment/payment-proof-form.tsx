"use client"

import { useActionState } from "react"
import { AlertCircle, Send } from "lucide-react"

import { FileDropzone } from "@/components/payment/file-dropzone"
import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  uploadPaymentProofAction,
  type ShipmentActionState,
} from "@/lib/actions/shipments"

export function PaymentProofForm({
  shipmentId,
  trackingNumber,
  totalAmount,
  defaultSenderName,
  todayInput,
}: {
  shipmentId: string
  trackingNumber: string
  totalAmount: number
  defaultSenderName: string
  todayInput: string
}) {
  const [state, formAction] = useActionState<
    ShipmentActionState | undefined,
    FormData
  >(uploadPaymentProofAction, undefined)

  const errors = state?.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="trackingNumber" value={trackingNumber} />

      {state?.message && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <TextField
        name="claimedAmount"
        label="Nominal yang ditransfer (Rp)"
        type="number"
        min="0"
        inputMode="numeric"
        required
        defaultValue={totalAmount}
        description="Isi sesuai nominal yang benar-benar Anda transfer."
        error={errors.claimedAmount}
      />

      <TextField
        name="senderAccountName"
        label="Nama pemilik rekening pengirim"
        required
        defaultValue={defaultSenderName}
        description="Membantu tim kami mencocokkan transfer di mutasi rekening."
        error={errors.senderAccountName}
      />

      <TextField
        name="transferDate"
        label="Tanggal transfer"
        type="date"
        required
        defaultValue={todayInput}
        max={todayInput}
        error={errors.transferDate}
      />

      <FileDropzone name="proof" label="Bukti transfer" error={errors.proof} />

      <SubmitButton className="w-full" pendingText="Mengunggah…">
        <Send aria-hidden />
        Kirim Bukti Transfer
      </SubmitButton>
    </form>
  )
}
