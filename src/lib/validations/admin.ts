import { z } from "zod"

import { SHIPMENT_LIMITS } from "@/lib/constants/service-type"

/**
 * Skema form panel admin — cerminan aturan backend PRD §7.2, §7.3, §7.5, §7.6.
 * Penegakan sebenarnya tetap di backend; ini untuk umpan balik cepat di form.
 */

const shipmentStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAID",
  "RECEIVED_AT_WAREHOUSE",
  "IN_TRANSIT",
  "ARRIVED_AT_DESTINATION",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "ON_HOLD",
  "CANCELLED",
])

/** Alasan penolakan wajib cukup panjang agar berguna bagi penerimanya. */
export const rejectionReasonSchema = z
  .string()
  .trim()
  .min(10, "Alasan minimal 10 karakter agar jelas bagi penerimanya")

export const updateStatusSchema = z
  .object({
    status: shipmentStatusSchema,
    location: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    notes: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    deliveredTo: z.string().trim().optional(),
    reason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "DELIVERED" && !data.deliveredTo) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveredTo"],
        message: "Nama penerima barang wajib diisi untuk status Diterima",
      })
    }

    if (
      (data.status === "ON_HOLD" || data.status === "CANCELLED") &&
      (data.reason ?? "").length < 5
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Alasan wajib diisi untuk status ini",
      })
    }
  })

export const bulkStatusSchema = z.object({
  status: shipmentStatusSchema,
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
})

export const weightCorrectionSchema = z.object({
  actualWeight: z.coerce
    .number({ error: "Berat wajib diisi dalam angka" })
    .positive("Berat harus lebih dari 0 kg")
    .max(
      SHIPMENT_LIMITS.maxWeightKg,
      `Berat maksimal ${SHIPMENT_LIMITS.maxWeightKg} kg per kiriman`
    ),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
})

export const routeSchema = z.object({
  serviceType: z.enum(["PORT_TO_PORT", "PORT_TO_DOOR"], {
    error: "Pilih jenis layanan",
  }),
  destinationCode: z
    .string()
    .trim()
    .min(2, "Kode tujuan minimal 2 karakter")
    .max(20, "Kode tujuan maksimal 20 karakter")
    .regex(
      /^[A-Za-z0-9_]+$/,
      "Kode tujuan hanya boleh huruf, angka, dan garis bawah"
    )
    .transform((value) => value.toUpperCase()),
  destinationName: z.string().trim().min(2, "Nama tujuan wajib diisi"),
  destinationRegion: z.string().trim().min(2, "Wilayah wajib diisi"),
  estimatedDays: z.coerce
    .number({ error: "Estimasi hari wajib diisi" })
    .int("Estimasi hari harus bilangan bulat")
    .min(1, "Estimasi minimal 1 hari")
    .max(30, "Estimasi maksimal 30 hari"),
})

export const rateSchema = z.object({
  pricePerKg: z.coerce
    .number({ error: "Harga per kg wajib diisi" })
    .positive("Harga per kg harus lebih besar dari nol"),
  minChargeableWeight: z.coerce
    .number({ error: "Berat minimum wajib diisi" })
    .positive("Berat minimum harus lebih besar dari nol"),
  baseFee: z.coerce
    .number({ error: "Biaya dasar wajib diisi" })
    .min(0, "Biaya dasar tidak boleh negatif"),
})

export type UpdateStatusValues = z.input<typeof updateStatusSchema>
export type WeightCorrectionValues = z.input<typeof weightCorrectionSchema>
export type RouteValues = z.input<typeof routeSchema>
export type RateValues = z.input<typeof rateSchema>
