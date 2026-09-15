"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api/client"
import { getErrorMessage, getFieldErrors } from "@/lib/api/errors"
import {
  changePasswordSchema,
  loginSchema,
  registerAgentSchema,
  registerCustomerSchema,
  updateProfileSchema,
} from "@/lib/validations/auth"
import type { CurrentUser, LoginResponse, UserRole } from "@/types/api"

import { createSession, destroySession } from "./session"

/**
 * Server Action untuk seluruh mutasi autentikasi.
 *
 * Dijalankan di server sehingga cookie sesi ditulis dari sisi server dan token
 * tidak pernah menyentuh browser (PRD §11.3). Error dikembalikan sebagai objek
 * terstruktur agar bisa ditempelkan langsung ke form, bukan dilempar.
 */

export type ActionState = {
  message?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

function toActionState(error: unknown): ActionState {
  return {
    message: getErrorMessage(error),
    fieldErrors: getFieldErrors(error),
  }
}

export async function loginAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error.issues) }
  }

  let role: UserRole = "CUSTOMER"

  try {
    const result = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: parsed.data,
      auth: false,
    })

    await createSession(result)
    role = result.user.role
  } catch (error) {
    return toActionState(error)
  }

  // Staf internal mendarat di area operasional, customer dan agen di dashboard.
  // Tujuan eksplisit dari parameter `next` tetap diutamakan.
  const home = role === "ADMIN" ? "/admin" : "/dashboard"
  const next = String(formData.get("next") ?? "") || home

  // redirect() melempar secara internal — harus di luar blok try
  redirect(next)
}

export async function registerCustomerAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerCustomerSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error.issues) }
  }

  const { confirmPassword: _confirm, ...payload } = parsed.data

  try {
    await apiFetch<CurrentUser>("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    })
  } catch (error) {
    return toActionState(error)
  }

  // Registrasi tidak menerbitkan token — pengguna diarahkan ke halaman masuk
  redirect("/masuk?terdaftar=1")
}

export async function registerAgentAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerAgentSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error.issues) }
  }

  const { confirmPassword: _confirm, ...payload } = parsed.data

  try {
    await apiFetch<CurrentUser>("/auth/register/agent", {
      method: "POST",
      body: payload,
      auth: false,
    })
  } catch (error) {
    return toActionState(error)
  }

  redirect("/masuk?terdaftar=agen")
}

export async function logoutAction(): Promise<void> {
  try {
    await apiFetch<null>("/auth/logout", { method: "POST" })
  } catch {
    // Kegagalan pencabutan di backend tidak boleh menahan pengguna keluar.
  }

  await destroySession()
  redirect("/masuk")
}

export async function changePasswordAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = changePasswordSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error.issues) }
  }

  try {
    await apiFetch<null>("/auth/change-password", {
      method: "POST",
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
    })
  } catch (error) {
    return toActionState(error)
  }

  // Ganti password mencabut seluruh sesi — pengguna harus masuk kembali.
  await destroySession()
  redirect("/masuk?password=diperbarui")
}

export async function updateProfileAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateProfileSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error.issues) }
  }

  try {
    await apiFetch<CurrentUser>("/auth/me", {
      method: "PATCH",
      body: parsed.data,
    })
  } catch (error) {
    return toActionState(error)
  }

  const { revalidatePath } = await import("next/cache")
  revalidatePath("/profil")

  return { success: true, message: "Profil berhasil diperbarui." }
}

function flattenZod(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string> {
  return issues.reduce<Record<string, string>>((acc, issue) => {
    const key = String(issue.path[0] ?? "form")
    if (!acc[key]) acc[key] = issue.message
    return acc
  }, {})
}
