import {
  AlertTriangle,
  CheckCheck,
  MapPin,
  PackageCheck,
  Plane,
  ShieldCheck,
  Truck,
  Wallet,
  Warehouse,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import type { ServiceType, ShipmentStatus } from "@/types/api"

/**
 * Satu-satunya tempat status kiriman diterjemahkan ke bahasa manusia
 * (PRD §8.3, NFR-UX-02). Jangan menulis label status di komponen mana pun.
 *
 * `tone` menentukan warna badge, tetapi label dan ikon selalu ikut ditampilkan
 * sehingga status tidak pernah dibedakan hanya oleh warna (NFR-UX-03).
 */
export type StatusTone =
  "brand" | "cta" | "success" | "warning" | "info" | "danger" | "muted"

export type ShipmentStatusMeta = {
  label: string
  description: string
  tone: StatusTone
  icon: LucideIcon
  /** Status akhir — tidak ada transisi keluar lagi (PRD §8.3). */
  isFinal: boolean
}

export const SHIPMENT_STATUS_META: Record<ShipmentStatus, ShipmentStatusMeta> =
  {
    PENDING_PAYMENT: {
      label: "Menunggu Pembayaran",
      description:
        "Booking sudah dibuat. Silakan lakukan pembayaran lalu unggah bukti transfer.",
      tone: "warning",
      icon: Wallet,
      isFinal: false,
    },
    PAID: {
      label: "Pembayaran Terverifikasi",
      description:
        "Pembayaran sudah dicek admin. Silakan antar barang ke gudang LogiSend di CGK.",
      tone: "info",
      icon: ShieldCheck,
      isFinal: false,
    },
    RECEIVED_AT_WAREHOUSE: {
      label: "Diterima di Gudang",
      description:
        "Barang sudah diterima dan ditimbang di gudang CGK, menunggu jadwal penerbangan.",
      tone: "info",
      icon: Warehouse,
      isFinal: false,
    },
    IN_TRANSIT: {
      label: "Dalam Perjalanan",
      description: "Barang sudah dimuat dan diterbangkan menuju kota tujuan.",
      tone: "brand",
      icon: Plane,
      isFinal: false,
    },
    ARRIVED_AT_DESTINATION: {
      label: "Tiba di Kota Tujuan",
      description: "Barang sudah tiba di bandara tujuan dan sedang diproses.",
      tone: "brand",
      icon: MapPin,
      isFinal: false,
    },
    READY_FOR_PICKUP: {
      label: "Siap Diambil",
      description:
        "Barang dapat diambil di gudang kargo bandara tujuan dengan menunjukkan identitas dan nomor resi.",
      tone: "cta",
      icon: PackageCheck,
      isFinal: false,
    },
    OUT_FOR_DELIVERY: {
      label: "Sedang Diantar",
      description: "Kurir sedang mengantar barang ke alamat penerima.",
      tone: "cta",
      icon: Truck,
      isFinal: false,
    },
    DELIVERED: {
      label: "Diterima",
      description: "Barang sudah diterima penerima. Pengiriman selesai.",
      tone: "success",
      icon: CheckCheck,
      isFinal: true,
    },
    ON_HOLD: {
      label: "Tertahan",
      description:
        "Ada kendala pada kiriman ini. Tim kami akan menghubungi Anda.",
      tone: "warning",
      icon: AlertTriangle,
      isFinal: false,
    },
    CANCELLED: {
      label: "Dibatalkan",
      description: "Kiriman ini dibatalkan.",
      tone: "danger",
      icon: XCircle,
      isFinal: true,
    },
  }

/** Urutan status untuk filter dan ringkasan dashboard. */
export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
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
]

export function getStatusMeta(status: ShipmentStatus): ShipmentStatusMeta {
  return SHIPMENT_STATUS_META[status]
}

/**
 * Aturan pembatalan oleh customer/agent (PRD §8.5): hanya saat kiriman masih
 * berstatus menunggu pembayaran.
 */
export function canCustomerCancel(status: ShipmentStatus): boolean {
  return status === "PENDING_PAYMENT"
}

/**
 * Aturan perubahan data oleh customer/agent (PRD §8.5): sebelum barang
 * diterima di gudang.
 */
export function canCustomerEdit(status: ShipmentStatus): boolean {
  return status === "PENDING_PAYMENT" || status === "PAID"
}

/** Kiriman masih perlu dibayar. */
export function needsPayment(status: ShipmentStatus): boolean {
  return status === "PENDING_PAYMENT"
}

/** Status yang dihitung sebagai "sedang berjalan" di ringkasan dashboard. */
export const IN_PROGRESS_STATUSES: ShipmentStatus[] = [
  "PAID",
  "RECEIVED_AT_WAREHOUSE",
  "IN_TRANSIT",
  "ARRIVED_AT_DESTINATION",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
]

// === State machine (PRD §8.3) ===

/**
 * Transisi status yang sah. Peta ini adalah terjemahan langsung dari diagram
 * PRD §8.3 dan dipakai dua arah: UI hanya menawarkan pilihan yang sah, dan
 * backend (mock) menolak yang tidak sah dengan `SHIPMENT_INVALID_TRANSITION`.
 *
 * Menyembunyikan pilihan di UI bukan penegakan aturan — keduanya harus ada.
 */
export const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["RECEIVED_AT_WAREHOUSE", "CANCELLED"],
  RECEIVED_AT_WAREHOUSE: ["IN_TRANSIT", "ON_HOLD", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED_AT_DESTINATION", "ON_HOLD"],
  ARRIVED_AT_DESTINATION: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "ON_HOLD"],
  READY_FOR_PICKUP: ["DELIVERED", "ON_HOLD"],
  OUT_FOR_DELIVERY: ["DELIVERED", "ON_HOLD"],
  // Keluar dari ON_HOLD ditentukan `previousStatus`, bukan daftar statis ini.
  ON_HOLD: [
    "RECEIVED_AT_WAREHOUSE",
    "IN_TRANSIT",
    "ARRIVED_AT_DESTINATION",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "CANCELLED",
  ],
  DELIVERED: [],
  CANCELLED: [],
}

/**
 * Status akhir pengantaran berbeda menurut layanan: Port to Port diambil
 * sendiri di bandara tujuan, Port to Door diantar ke alamat (PRD §8.3 aturan 3).
 */
function isAllowedForService(
  status: ShipmentStatus,
  serviceType: ServiceType
): boolean {
  if (status === "READY_FOR_PICKUP") return serviceType === "PORT_TO_PORT"
  if (status === "OUT_FOR_DELIVERY") return serviceType === "PORT_TO_DOOR"
  return true
}

/**
 * Transisi yang boleh dipilih dari status sekarang.
 *
 * Dari `ON_HOLD`, kiriman hanya boleh kembali ke status sebelum tertahan atau
 * dibatalkan (PRD §8.3 aturan 4) — karena itu `previousStatus` diperlukan.
 */
export function getAllowedTransitions(
  status: ShipmentStatus,
  serviceType: ServiceType,
  previousStatus?: ShipmentStatus | null
): ShipmentStatus[] {
  if (status === "ON_HOLD") {
    const back =
      previousStatus && previousStatus !== "ON_HOLD" ? [previousStatus] : []
    return [...back, "CANCELLED" as ShipmentStatus].filter((next) =>
      isAllowedForService(next, serviceType)
    )
  }

  return STATUS_TRANSITIONS[status].filter((next) =>
    isAllowedForService(next, serviceType)
  )
}

export function isValidTransition(
  from: ShipmentStatus,
  to: ShipmentStatus,
  serviceType: ServiceType,
  previousStatus?: ShipmentStatus | null
): boolean {
  return getAllowedTransitions(from, serviceType, previousStatus).includes(to)
}

/** `ON_HOLD` dan `CANCELLED` wajib menyertakan alasan (PRD FR-TRACK-02). */
export function requiresReason(status: ShipmentStatus): boolean {
  return status === "ON_HOLD" || status === "CANCELLED"
}

/** `DELIVERED` wajib mencatat siapa yang menerima barang (PRD FR-TRACK-02). */
export function requiresDeliveredTo(status: ShipmentStatus): boolean {
  return status === "DELIVERED"
}

/** Kiriman yang sudah selesai tidak ikut dihitung sebagai pekerjaan tertunda. */
export function isSettled(status: ShipmentStatus): boolean {
  return SHIPMENT_STATUS_META[status].isFinal
}

// === Status pembayaran ===

export const PAYMENT_STATUS_LABEL = {
  UNPAID: "Belum Dibayar",
  WAITING_VERIFICATION: "Menunggu Verifikasi",
  PAID: "Lunas",
} as const

export const PAYMENT_RECORD_STATUS_LABEL = {
  WAITING_VERIFICATION: "Menunggu Verifikasi",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
} as const
