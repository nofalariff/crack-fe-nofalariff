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

import type { ShipmentStatus } from "@/types/api"

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
