import { z } from "zod"

import { normalizePhone } from "@/lib/format"

/**
 * Skema validasi form autentikasi — cerminan aturan backend PRD FR-AUTH-01.
 * Validasi di sini hanya untuk pengalaman pengguna; backend tetap penegak
 * sebenarnya (NFR-SEC-03).
 */

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[a-zA-Z]/, "Password harus mengandung minimal satu huruf")
  .regex(/[0-9]/, "Password harus mengandung minimal satu angka")

export const phoneSchema = z
  .string()
  .min(1, "Nomor HP wajib diisi")
  .transform((value, ctx) => {
    const normalized = normalizePhone(value)
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Format nomor HP tidak valid. Contoh: 0812-3456-7890",
      })
      return z.NEVER
    }
    return normalized
  })

// Rapikan dulu baru divalidasi: pengguna sering menyalin email dengan spasi
// di ujung atau huruf kapital, dan itu bukan alasan menolak pendaftaran.
export const emailSchema = z
  .string()
  .min(1, "Email wajib diisi")
  .trim()
  .toLowerCase()
  .pipe(z.email("Format email tidak valid"))

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi"),
})

export const registerCustomerSchema = z
  .object({
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter").trim(),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })

export const registerAgentSchema = z
  .object({
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter").trim(),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    companyName: z.string().min(3, "Nama perusahaan minimal 3 karakter").trim(),
    companyAddress: z
      .string()
      .min(10, "Alamat perusahaan minimal 10 karakter")
      .trim(),
    picName: z.string().min(3, "Nama PIC minimal 3 karakter").trim(),
    picPhone: phoneSchema,
    npwp: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Password baru harus berbeda dari password lama",
    path: ["newPassword"],
  })

export const updateProfileSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter").trim(),
  phone: phoneSchema,
  companyName: z.string().trim().optional(),
  companyAddress: z.string().trim().optional(),
  picName: z.string().trim().optional(),
  picPhone: z.string().trim().optional(),
  npwp: z.string().trim().optional(),
})

export type LoginValues = z.input<typeof loginSchema>
export type RegisterCustomerValues = z.input<typeof registerCustomerSchema>
export type RegisterAgentValues = z.input<typeof registerAgentSchema>
export type ChangePasswordValues = z.input<typeof changePasswordSchema>
export type UpdateProfileValues = z.input<typeof updateProfileSchema>
