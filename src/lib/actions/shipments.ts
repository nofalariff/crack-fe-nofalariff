"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  cancelShipment,
  createShipment,
  updateShipment,
  uploadPaymentProof,
} from "@/lib/api/endpoints"
import { getErrorMessage, getFieldErrors } from "@/lib/api/errors"
import {
  createShipmentSchema,
  paymentProofSchema,
  updateShipmentSchema,
} from "@/lib/validations/shipment"

export type ShipmentActionState = {
  message?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

function zodFieldErrors(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string> {
  return issues.reduce<Record<string, string>>((acc, issue) => {
    const key = String(issue.path[0] ?? "form")
    if (!acc[key]) acc[key] = issue.message
    return acc
  }, {})
}

function checkboxValue(formData: FormData, name: string): boolean {
  const value = formData.get(name)
  return value === "on" || value === "true" || value === "1"
}

/**
 * Buat booking baru (FR-BOOK-01).
 *
 * Total tagihan sepenuhnya dihitung backend; nilai estimasi yang ditampilkan di
 * form tidak pernah dikirim sebagai harga.
 */
export async function createShipmentAction(
  _prev: ShipmentActionState | undefined,
  formData: FormData
): Promise<ShipmentActionState> {
  const parsed = createShipmentSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    prohibitedItemsAgreed: checkboxValue(formData, "prohibitedItemsAgreed"),
    saveRecipient: checkboxValue(formData, "saveRecipient"),
  })

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  let trackingNumber: string

  try {
    const shipment = await createShipment(parsed.data)
    trackingNumber = shipment.trackingNumber
  } catch (error) {
    return {
      message: getErrorMessage(error),
      fieldErrors: getFieldErrors(error),
    }
  }

  revalidatePath("/kiriman")
  revalidatePath("/dashboard")
  redirect(`/kirim/${trackingNumber}/invoice`)
}

/** Ubah data kiriman yang masih boleh diubah (FR-BOOK-04). */
export async function updateShipmentAction(
  _prev: ShipmentActionState | undefined,
  formData: FormData
): Promise<ShipmentActionState> {
  const id = String(formData.get("shipmentId") ?? "")
  const trackingNumber = String(formData.get("trackingNumber") ?? "")

  const parsed = updateShipmentSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  try {
    await updateShipment(id, parsed.data)
  } catch (error) {
    return {
      message: getErrorMessage(error),
      fieldErrors: getFieldErrors(error),
    }
  }

  revalidatePath(`/kirim/${trackingNumber}`)
  revalidatePath("/kiriman")
  redirect(`/kirim/${trackingNumber}?diperbarui=1`)
}

/** Batalkan kiriman (FR-BOOK-05). */
export async function cancelShipmentAction(
  _prev: ShipmentActionState | undefined,
  formData: FormData
): Promise<ShipmentActionState> {
  const id = String(formData.get("shipmentId") ?? "")
  const trackingNumber = String(formData.get("trackingNumber") ?? "")
  const reason = String(formData.get("reason") ?? "").trim() || undefined

  try {
    await cancelShipment(id, reason)
  } catch (error) {
    return { message: getErrorMessage(error) }
  }

  revalidatePath(`/kirim/${trackingNumber}`)
  revalidatePath("/kiriman")
  revalidatePath("/dashboard")

  return { success: true, message: "Kiriman berhasil dibatalkan." }
}

/** Unggah bukti pembayaran (FR-PAY-02). */
export async function uploadPaymentProofAction(
  _prev: ShipmentActionState | undefined,
  formData: FormData
): Promise<ShipmentActionState> {
  const id = String(formData.get("shipmentId") ?? "")
  const trackingNumber = String(formData.get("trackingNumber") ?? "")

  const parsed = paymentProofSchema.safeParse({
    claimedAmount: formData.get("claimedAmount"),
    senderAccountName: formData.get("senderAccountName"),
    transferDate: formData.get("transferDate"),
  })

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  const proof = formData.get("proof")
  if (!(proof instanceof File) || proof.size === 0) {
    return { fieldErrors: { proof: "Bukti transfer wajib diunggah" } }
  }

  const payload = new FormData()
  payload.set("proof", proof)
  payload.set("claimedAmount", String(parsed.data.claimedAmount))
  payload.set("senderAccountName", parsed.data.senderAccountName)
  payload.set("transferDate", parsed.data.transferDate)

  try {
    await uploadPaymentProof(id, payload)
  } catch (error) {
    return {
      message: getErrorMessage(error),
      fieldErrors: getFieldErrors(error),
    }
  }

  revalidatePath(`/kirim/${trackingNumber}`)
  revalidatePath(`/kirim/${trackingNumber}/invoice`)
  revalidatePath("/kiriman")
  revalidatePath("/dashboard")
  redirect(`/kirim/${trackingNumber}/invoice?bukti=terkirim`)
}
