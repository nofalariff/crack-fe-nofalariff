import { z } from "zod"

import { SHIPMENT_LIMITS } from "@/lib/constants/service-type"
import { normalizePhone } from "@/lib/format"

/**
 * Skema form kalkulator ongkir dan booking — cerminan aturan backend
 * (PRD FR-RATE-02, FR-BOOK-01, §8.2). Penegakan sebenarnya tetap di backend.
 */

export const serviceTypeSchema = z.enum(["PORT_TO_PORT", "PORT_TO_DOOR"], {
  error: "Pilih jenis layanan",
})

export const weightSchema = z.coerce
  .number({ error: "Berat wajib diisi dalam angka" })
  .positive("Berat harus lebih dari 0 kg")
  .max(
    SHIPMENT_LIMITS.maxWeightKg,
    `Berat maksimal ${SHIPMENT_LIMITS.maxWeightKg} kg per kiriman. Silakan pecah menjadi beberapa kiriman.`
  )

export const phoneField = z
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

export const calculateRateSchema = z.object({
  serviceType: serviceTypeSchema,
  destinationCode: z.string().min(1, "Pilih tujuan pengiriman"),
  weight: weightSchema,
})

export type CalculateRateValues = z.input<typeof calculateRateSchema>

/**
 * Skema booking. Alamat penerima wajib lengkap untuk Port to Door
 * (PRD FR-BOOK-01) — divalidasi lintas field lewat superRefine.
 */
export const createShipmentSchema = z
  .object({
    serviceType: serviceTypeSchema,
    destinationCode: z.string().min(1, "Pilih tujuan pengiriman"),
    declaredWeight: weightSchema,
    totalColli: z.coerce
      .number({ error: "Jumlah koli wajib diisi" })
      .int("Jumlah koli harus bilangan bulat")
      .min(1, "Minimal 1 koli")
      .max(
        SHIPMENT_LIMITS.maxColli,
        `Maksimal ${SHIPMENT_LIMITS.maxColli} koli`
      ),

    senderName: z.string().min(3, "Nama pengirim minimal 3 karakter").trim(),
    senderPhone: phoneField,

    recipientName: z.string().min(3, "Nama penerima minimal 3 karakter").trim(),
    recipientPhone: phoneField,
    recipientAddress: z.string().trim().default(""),
    recipientCity: z.string().min(2, "Kota/kabupaten wajib diisi").trim(),
    recipientPostalCode: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),

    itemDescription: z
      .string()
      .min(3, "Deskripsi isi barang minimal 3 karakter")
      .trim(),
    declaredValue: z
      .union([z.coerce.number().nonnegative(), z.literal("")])
      .optional()
      .transform((value) =>
        value === "" || value === undefined ? undefined : Number(value)
      ),
    notes: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),

    prohibitedItemsAgreed: z.coerce
      .boolean()
      .refine((value) => value === true, {
        message: "Anda harus menyetujui pernyataan barang terlarang",
      }),
    saveRecipient: z.coerce.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.serviceType === "PORT_TO_DOOR" &&
      data.recipientAddress.length < 10
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["recipientAddress"],
        message:
          "Alamat lengkap penerima wajib diisi (minimal 10 karakter) untuk layanan Port to Door",
      })
    }
  })

export type CreateShipmentValues = z.input<typeof createShipmentSchema>

export const updateShipmentSchema = z.object({
  recipientName: z.string().min(3, "Nama penerima minimal 3 karakter").trim(),
  recipientPhone: phoneField,
  recipientAddress: z.string().trim().default(""),
  recipientCity: z.string().min(2, "Kota/kabupaten wajib diisi").trim(),
  recipientPostalCode: z.string().trim().optional(),
  itemDescription: z
    .string()
    .min(3, "Deskripsi isi barang minimal 3 karakter")
    .trim(),
  notes: z.string().trim().optional(),
})

export const recipientSchema = z.object({
  label: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  name: z.string().min(3, "Nama penerima minimal 3 karakter").trim(),
  phone: phoneField,
  address: z.string().min(5, "Alamat minimal 5 karakter").trim(),
  city: z.string().min(2, "Kota/kabupaten wajib diisi").trim(),
  postalCode: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
})

export type RecipientValues = z.input<typeof recipientSchema>

export const paymentProofSchema = z.object({
  claimedAmount: z.coerce
    .number({ error: "Nominal transfer wajib diisi" })
    .positive("Nominal transfer harus lebih dari 0"),
  senderAccountName: z
    .string()
    .min(3, "Nama pemilik rekening minimal 3 karakter")
    .trim(),
  transferDate: z.string().min(1, "Tanggal transfer wajib diisi"),
})
