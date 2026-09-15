import type { ApiErrorCode } from "@/types/api"

/**
 * Error yang dilempar `apiFetch` saat backend membalas `success: false`.
 * Membawa kode domain (PRD §10.3) agar pemanggil bisa bereaksi spesifik.
 */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: Array<{ field: string; message: string }>

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
    this.details = details
  }

  is(code: ApiErrorCode): boolean {
    return this.code === code
  }
}

/** Sesi tidak valid / gagal di-refresh — pemanggil harus memaksa login ulang. */
export class UnauthorizedError extends ApiError {
  constructor(message = "Sesi Anda sudah berakhir. Silakan masuk kembali.") {
    super("UNAUTHORIZED", message, 401)
    this.name = "UnauthorizedError"
  }
}

/**
 * Pesan bahasa Indonesia per kode error domain (NFR-UX-02).
 * Pesan dari backend dipakai bila kodenya tidak dikenal di sini.
 */
const MESSAGES: Record<ApiErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS: "Email atau password salah.",
  AUTH_ACCOUNT_SUSPENDED:
    "Akun Anda sedang ditangguhkan. Silakan hubungi tim LogiSend.",
  AGENT_NOT_APPROVED:
    "Akun agen Anda masih menunggu persetujuan admin, sehingga belum bisa membuat booking.",
  ROUTE_NOT_SERVED: "Rute ini belum kami layani.",
  ROUTE_INACTIVE: "Rute ini sedang tidak tersedia. Silakan pilih tujuan lain.",
  WEIGHT_EXCEEDS_LIMIT:
    "Berat melebihi batas satu kiriman. Silakan pecah menjadi beberapa kiriman.",
  SHIPMENT_INVALID_TRANSITION: "Status kiriman tidak dapat diubah ke sana.",
  SHIPMENT_NOT_CANCELLABLE:
    "Kiriman ini sudah tidak dapat dibatalkan. Silakan hubungi tim operasional kami.",
  SHIPMENT_NOT_EDITABLE: "Kiriman ini sudah tidak dapat diubah.",
  PAYMENT_ALREADY_VERIFIED: "Pembayaran untuk kiriman ini sudah diverifikasi.",
  FILE_TYPE_NOT_ALLOWED:
    "Format berkas tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.",
  FILE_TOO_LARGE: "Ukuran berkas melebihi 5 MB.",
  PROHIBITED_ITEMS_NOT_AGREED:
    "Anda harus menyetujui pernyataan barang terlarang sebelum melanjutkan.",
  VALIDATION_ERROR: "Ada data yang belum benar. Silakan periksa kembali.",
  NOT_FOUND: "Data yang Anda cari tidak ditemukan.",
  UNAUTHORIZED: "Sesi Anda sudah berakhir. Silakan masuk kembali.",
  FORBIDDEN: "Anda tidak memiliki akses ke data ini.",
  INTERNAL_ERROR:
    "Terjadi gangguan pada sistem kami. Silakan coba beberapa saat lagi.",
}

/** Pesan siap tampil untuk sebuah error apa pun bentuknya. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const known = MESSAGES[error.code as ApiErrorCode]
    return known ?? error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return MESSAGES.INTERNAL_ERROR
}

/**
 * Ubah `details` dari backend menjadi peta error per field agar bisa langsung
 * ditempelkan ke form.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details) return {}

  return error.details.reduce<Record<string, string>>((acc, detail) => {
    if (!acc[detail.field]) acc[detail.field] = detail.message
    return acc
  }, {})
}
