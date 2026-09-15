import { format, parseISO } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { TZDate } from "@date-fns/tz"

const WIB = "Asia/Jakarta"

/**
 * Format nominal rupiah: 1250000 -> "Rp1.250.000".
 * Nominal selalu bilangan bulat rupiah (PRD §8.2) — tanpa desimal.
 */
export function formatRupiah(amount: number | bigint | string): string {
  const value = typeof amount === "string" ? Number(amount) : Number(amount)

  if (!Number.isFinite(value)) return "Rp0"

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, "")
}

function toWib(value: string | Date): TZDate {
  const date = typeof value === "string" ? parseISO(value) : value
  return new TZDate(date, WIB)
}

/** "15 Sep 2026, 14:30 WIB" — waktu API selalu UTC, tampilan selalu WIB. */
export function formatDateTimeWIB(value: string | Date): string {
  return `${format(toWib(value), "d MMM yyyy, HH:mm", { locale: localeId })} WIB`
}

/** "15 September 2026" */
export function formatDateLong(value: string | Date): string {
  return format(toWib(value), "d MMMM yyyy", { locale: localeId })
}

/** "15 Sep 2026" */
export function formatDateShort(value: string | Date): string {
  return format(toWib(value), "d MMM yyyy", { locale: localeId })
}

/** Nilai untuk <input type="date">, tetap dalam zona WIB. */
export function formatDateInput(value: string | Date): string {
  return format(toWib(value), "yyyy-MM-dd")
}

/** "2,5 kg" — berat pakai koma sebagai pemisah desimal. */
export function formatWeight(kg: number, unit = "kg"): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(kg)
  return `${formatted} ${unit}`
}

/**
 * Normalisasi nomor HP Indonesia ke format +62 (FR-AUTH-01).
 * Mengembalikan null bila tidak dapat dinormalisasi.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "")
  let national: string

  if (digits.startsWith("+62")) national = digits.slice(3)
  else if (digits.startsWith("62")) national = digits.slice(2)
  else if (digits.startsWith("0")) national = digits.slice(1)
  else return null

  if (!/^\d+$/.test(national)) return null
  // 9-15 digit termasuk kode negara (FR-AUTH-01)
  if (national.length < 7 || national.length > 13) return null

  return `+62${national}`
}

/** Tampilan nomor HP yang lebih mudah dibaca: "+62 812-3456-7890". */
export function formatPhone(input: string): string {
  const normalized = normalizePhone(input)
  if (!normalized) return input

  const national = normalized.slice(3)
  const parts = [national.slice(0, 3), national.slice(3, 7), national.slice(7)]
  return `+62 ${parts.filter(Boolean).join("-")}`
}

/**
 * Normalisasi input pencarian nomor resi: case-insensitive dan mengabaikan
 * tanda hubung (PRD §8.1).
 */
export function normalizeTrackingNumber(input: string): string {
  return input.trim().toUpperCase().replace(/-/g, "")
}

/** Jumlah hari ("3 hari" / "2–3 hari") dari estimasi rute. */
export function formatEstimatedDays(days: number): string {
  return `${days} hari`
}
