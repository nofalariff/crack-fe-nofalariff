"use server"

import { revalidatePath } from "next/cache"

import {
  createRecipient,
  deleteRecipient,
  updateRecipient,
} from "@/lib/api/endpoints"
import { getErrorMessage, getFieldErrors } from "@/lib/api/errors"
import { recipientSchema } from "@/lib/validations/shipment"

export type RecipientActionState = {
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

/** Tambah atau ubah penerima di buku alamat (FR-BOOK-06). */
export async function saveRecipientAction(
  _prev: RecipientActionState | undefined,
  formData: FormData
): Promise<RecipientActionState> {
  const id = String(formData.get("recipientId") ?? "")

  const parsed = recipientSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) }
  }

  try {
    if (id) await updateRecipient(id, parsed.data)
    else await createRecipient(parsed.data)
  } catch (error) {
    return {
      message: getErrorMessage(error),
      fieldErrors: getFieldErrors(error),
    }
  }

  revalidatePath("/penerima")

  return {
    success: true,
    message: id
      ? "Penerima berhasil diperbarui."
      : "Penerima berhasil disimpan.",
  }
}

/**
 * Hapus penerima dari buku alamat.
 *
 * Data penerima pada kiriman yang sudah dibuat disalin saat booking, jadi
 * penghapusan di sini tidak mengubah kiriman mana pun (PRD §9.3).
 */
export async function deleteRecipientAction(
  _prev: RecipientActionState | undefined,
  formData: FormData
): Promise<RecipientActionState> {
  const id = String(formData.get("recipientId") ?? "")

  try {
    await deleteRecipient(id)
  } catch (error) {
    return { message: getErrorMessage(error) }
  }

  revalidatePath("/penerima")
  return { success: true, message: "Penerima dihapus dari buku alamat." }
}
