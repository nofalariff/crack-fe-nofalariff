"use server"

import { calculateRate } from "@/lib/api/endpoints"
import { getErrorMessage } from "@/lib/api/errors"
import { calculateRateSchema } from "@/lib/validations/shipment"
import type { RateCalculation } from "@/types/api"

export type RateState = {
  result?: RateCalculation
  message?: string
  fieldErrors?: Record<string, string>
  /** Input terakhir agar form tetap terisi setelah submit. */
  values?: {
    serviceType?: string
    destinationCode?: string
    weight?: string
  }
}

/**
 * Hitung estimasi ongkos kirim (FR-RATE-02).
 *
 * Perhitungan sepenuhnya dilakukan backend — halaman ini hanya menampilkan
 * hasilnya, dan hasil itu selalu diberi label "estimasi" karena berat final
 * ditentukan saat penimbangan di gudang (PRD §11.4).
 */
export async function calculateRateAction(
  _prev: RateState | undefined,
  formData: FormData
): Promise<RateState> {
  const values = {
    serviceType: String(formData.get("serviceType") ?? ""),
    destinationCode: String(formData.get("destinationCode") ?? ""),
    weight: String(formData.get("weight") ?? ""),
  }

  const parsed = calculateRateSchema.safeParse(values)

  if (!parsed.success) {
    return {
      values,
      fieldErrors: parsed.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          const key = String(issue.path[0] ?? "form")
          if (!acc[key]) acc[key] = issue.message
          return acc
        },
        {}
      ),
    }
  }

  try {
    const result = await calculateRate(parsed.data)
    return { result, values }
  } catch (error) {
    return { values, message: getErrorMessage(error) }
  }
}

/**
 * Versi ringkas untuk ringkasan biaya di form booking: dipanggil ulang setiap
 * layanan/tujuan/berat berubah, dan diam-diam mengembalikan null bila input
 * belum lengkap sehingga tidak memunculkan error di tengah pengisian.
 */
export async function estimateRateAction(input: {
  serviceType: string
  destinationCode: string
  weight: number
}): Promise<{ result: RateCalculation | null; message?: string }> {
  const parsed = calculateRateSchema.safeParse(input)
  if (!parsed.success) return { result: null }

  try {
    return { result: await calculateRate(parsed.data) }
  } catch (error) {
    return { result: null, message: getErrorMessage(error) }
  }
}
