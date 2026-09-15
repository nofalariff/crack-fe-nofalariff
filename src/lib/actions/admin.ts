"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  approveAgent,
  bulkUpdateStatus,
  correctShipmentWeight,
  createRoute,
  createWalkInShipment,
  rejectAgent,
  rejectPayment,
  updateRate,
  updateRoute,
  updateShipmentStatus,
  updateUserStatus,
  verifyPayment,
} from "@/lib/api/admin"
import { getErrorMessage, getFieldErrors } from "@/lib/api/errors"
import {
  bulkStatusSchema,
  rateSchema,
  rejectionReasonSchema,
  routeSchema,
  updateStatusSchema,
  weightCorrectionSchema,
} from "@/lib/validations/admin"
import { createShipmentSchema } from "@/lib/validations/shipment"
import type { BulkStatusResult, ShipmentStatus, UserStatus } from "@/types/api"

/**
 * Server Action panel admin.
 *
 * Mengikuti pola yang sudah dipakai di sisi customer: error dikembalikan sebagai
 * objek terstruktur agar bisa ditempelkan ke form, bukan dilempar.
 */

export type AdminActionState = {
  message?: string
  fieldErrors?: Record<string, string>
  success?: boolean
  /** Diisi khusus oleh aksi massal agar hasil per kiriman bisa ditampilkan. */
  bulkResult?: BulkStatusResult
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

function toErrorState(error: unknown): AdminActionState {
  return {
    message: getErrorMessage(error),
    fieldErrors: getFieldErrors(error),
  }
}

function checkbox(formData: FormData, name: string): boolean {
  const value = formData.get(name)
  return value === "on" || value === "true" || value === "1"
}

/** Segarkan seluruh permukaan admin yang menampilkan data kiriman. */
function revalidateShipmentSurfaces(trackingNumber?: string) {
  revalidatePath("/admin")
  revalidatePath("/admin/kiriman")
  revalidatePath("/admin/pembayaran")
  revalidatePath("/admin/audit-log")
  if (trackingNumber) revalidatePath(`/admin/kiriman/${trackingNumber}`)
  // Sisi customer ikut berubah — status dan tagihannya yang bergerak.
  revalidatePath("/kiriman")
  revalidatePath("/dashboard")
}

// === Status kiriman (FR-TRACK-02) ===

export async function updateStatusAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const shipmentId = String(formData.get("shipmentId") ?? "")
  const trackingNumber = String(formData.get("trackingNumber") ?? "")

  const parsed = updateStatusSchema.safeParse({
    status: formData.get("status"),
    location: formData.get("location") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    deliveredTo: formData.get("deliveredTo") ?? undefined,
    reason: formData.get("reason") ?? undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  try {
    await updateShipmentStatus(shipmentId, parsed.data)
  } catch (error) {
    return toErrorState(error)
  }

  revalidateShipmentSurfaces(trackingNumber)
  return { success: true, message: "Status kiriman berhasil diperbarui." }
}

// === Status massal (FR-TRACK-03) ===

export async function bulkStatusAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const shipmentIds = formData.getAll("shipmentIds").map(String).filter(Boolean)

  if (shipmentIds.length === 0) {
    return { message: "Pilih minimal satu kiriman terlebih dahulu." }
  }

  const parsed = bulkStatusSchema.safeParse({
    status: formData.get("status"),
    notes: formData.get("notes") ?? undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  let bulkResult: BulkStatusResult

  try {
    bulkResult = await bulkUpdateStatus({
      shipmentIds,
      status: parsed.data.status as ShipmentStatus,
      notes: parsed.data.notes,
    })
  } catch (error) {
    return toErrorState(error)
  }

  revalidateShipmentSurfaces()

  // Sebagian gagal bukan berarti operasinya gagal — laporkan apa adanya.
  return {
    success: true,
    bulkResult,
    message:
      bulkResult.skipped.length === 0
        ? `${bulkResult.updatedCount} kiriman berhasil diperbarui.`
        : `${bulkResult.updatedCount} berhasil, ${bulkResult.skipped.length} dilewati.`,
  }
}

// === Koreksi berat (FR-PAY-05) ===

export async function correctWeightAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const shipmentId = String(formData.get("shipmentId") ?? "")
  const trackingNumber = String(formData.get("trackingNumber") ?? "")

  const parsed = weightCorrectionSchema.safeParse({
    actualWeight: formData.get("actualWeight"),
    notes: formData.get("notes") ?? undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  let message: string

  try {
    const result = await correctShipmentWeight(shipmentId, parsed.data)
    message =
      result.difference === 0
        ? "Berat diperbarui; tagihan tidak berubah."
        : result.difference > 0
          ? `Berat diperbarui. Tagihan naik — ada kekurangan bayar.`
          : `Berat diperbarui. Tagihan turun — ada kelebihan bayar untuk ditindaklanjuti.`
  } catch (error) {
    return toErrorState(error)
  }

  revalidateShipmentSurfaces(trackingNumber)
  return { success: true, message }
}

// === Booking walk-in (FR-BOOK-01) ===

export async function createWalkInAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = createShipmentSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    prohibitedItemsAgreed: checkbox(formData, "prohibitedItemsAgreed"),
  })

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  const onBehalfOfUserId = String(formData.get("onBehalfOfUserId") ?? "").trim()
  let trackingNumber: string

  try {
    const shipment = await createWalkInShipment({
      ...parsed.data,
      onBehalfOfUserId: onBehalfOfUserId || undefined,
    })
    trackingNumber = shipment.trackingNumber
  } catch (error) {
    return toErrorState(error)
  }

  revalidateShipmentSurfaces()
  redirect(`/admin/kiriman/${trackingNumber}?dibuat=1`)
}

// === Pembayaran (FR-PAY-04) ===

export async function verifyPaymentAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const paymentId = String(formData.get("paymentId") ?? "")

  try {
    await verifyPayment(paymentId)
  } catch (error) {
    return toErrorState(error)
  }

  revalidateShipmentSurfaces(String(formData.get("trackingNumber") ?? ""))
  return { success: true, message: "Pembayaran diverifikasi." }
}

export async function rejectPaymentAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const paymentId = String(formData.get("paymentId") ?? "")
  const parsed = rejectionReasonSchema.safeParse(formData.get("reason"))

  if (!parsed.success) {
    return { fieldErrors: { reason: parsed.error.issues[0].message } }
  }

  try {
    await rejectPayment(paymentId, parsed.data)
  } catch (error) {
    return toErrorState(error)
  }

  revalidateShipmentSurfaces(String(formData.get("trackingNumber") ?? ""))
  return { success: true, message: "Pembayaran ditolak." }
}

// === Agen (FR-AGENT-02/03) ===

export async function approveAgentAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const userId = String(formData.get("userId") ?? "")

  try {
    await approveAgent(userId)
  } catch (error) {
    return toErrorState(error)
  }

  revalidatePath("/admin/agen")
  revalidatePath("/admin/pengguna")
  revalidatePath("/admin")
  revalidatePath("/admin/audit-log")

  return { success: true, message: "Agen disetujui." }
}

export async function rejectAgentAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const userId = String(formData.get("userId") ?? "")
  const parsed = rejectionReasonSchema.safeParse(formData.get("reason"))

  if (!parsed.success) {
    return { fieldErrors: { reason: parsed.error.issues[0].message } }
  }

  try {
    await rejectAgent(userId, parsed.data)
  } catch (error) {
    return toErrorState(error)
  }

  revalidatePath("/admin/agen")
  revalidatePath("/admin")
  revalidatePath("/admin/audit-log")

  return { success: true, message: "Pengajuan agen ditolak." }
}

// === Pengguna (FR-ADM-04) ===

export async function updateUserStatusAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const userId = String(formData.get("userId") ?? "")
  const status = String(formData.get("status") ?? "") as UserStatus

  if (status !== "ACTIVE" && status !== "SUSPENDED") {
    return { message: "Status akun tidak dikenal." }
  }

  try {
    await updateUserStatus(userId, status)
  } catch (error) {
    return toErrorState(error)
  }

  revalidatePath("/admin/pengguna")
  revalidatePath(`/admin/pengguna/${userId}`)
  revalidatePath("/admin/audit-log")

  return {
    success: true,
    message:
      status === "SUSPENDED"
        ? "Akun ditangguhkan."
        : "Akun diaktifkan kembali.",
  }
}

// === Rute & tarif (FR-RATE-03/04) ===

export async function saveRouteAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const routeId = String(formData.get("routeId") ?? "")
  const parsed = routeSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  try {
    if (routeId) await updateRoute(routeId, parsed.data)
    else await createRoute(parsed.data)
  } catch (error) {
    return toErrorState(error)
  }

  revalidatePath("/admin/rute")
  revalidatePath("/admin/audit-log")
  // Halaman publik memakai daftar rute yang sama.
  revalidatePath("/")
  revalidatePath("/layanan")
  revalidatePath("/cek-ongkir")

  return {
    success: true,
    message: routeId ? "Rute diperbarui." : "Rute baru ditambahkan.",
  }
}

export async function toggleRouteActiveAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const routeId = String(formData.get("routeId") ?? "")
  const isActive = checkbox(formData, "isActive")

  try {
    await updateRoute(routeId, { isActive })
  } catch (error) {
    return toErrorState(error)
  }

  revalidatePath("/admin/rute")
  revalidatePath("/admin/audit-log")
  revalidatePath("/")
  revalidatePath("/layanan")
  revalidatePath("/cek-ongkir")

  return {
    success: true,
    message: isActive ? "Rute diaktifkan." : "Rute dinonaktifkan.",
  }
}

export async function saveRateAction(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const routeId = String(formData.get("routeId") ?? "")
  const parsed = rateSchema.safeParse({
    pricePerKg: formData.get("pricePerKg"),
    minChargeableWeight: formData.get("minChargeableWeight"),
    baseFee: formData.get("baseFee"),
  })

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  try {
    await updateRate(routeId, parsed.data)
  } catch (error) {
    return toErrorState(error)
  }

  revalidatePath("/admin/rute")
  revalidatePath("/admin/audit-log")
  revalidatePath("/cek-ongkir")

  return {
    success: true,
    message:
      "Tarif diperbarui. Berlaku untuk booking baru; kiriman yang sudah terbit tidak berubah.",
  }
}
