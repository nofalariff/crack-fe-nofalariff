import { Home, Plane, type LucideIcon } from "lucide-react"

import type { ServiceType } from "@/types/api"

export type ServiceTypeMeta = {
  label: string
  shortLabel: string
  description: string
  /** Apa yang terjadi di ujung pengiriman — dipakai di landing & detail. */
  endpointNote: string
  icon: LucideIcon
  /** Alamat penerima wajib diisi lengkap (PRD FR-BOOK-01). */
  requiresFullAddress: boolean
}

export const SERVICE_TYPE_META: Record<ServiceType, ServiceTypeMeta> = {
  PORT_TO_PORT: {
    label: "Port to Port",
    shortLabel: "Bandara ke Bandara",
    description:
      "Pengiriman dari counter kargo Bandara Soekarno-Hatta (CGK) ke counter kargo bandara tujuan.",
    endpointNote:
      "Penerima mengambil sendiri barang di gudang kargo bandara tujuan dengan menunjukkan identitas dan nomor resi.",
    icon: Plane,
    requiresFullAddress: false,
  },
  PORT_TO_DOOR: {
    label: "Port to Door",
    shortLabel: "Bandara ke Rumah",
    description:
      "Pengiriman dari counter kargo Bandara Soekarno-Hatta (CGK) sampai ke alamat penerima.",
    endpointNote: "Barang diantar kurir sampai ke alamat penerima.",
    icon: Home,
    requiresFullAddress: true,
  },
}

export const SERVICE_TYPES: ServiceType[] = ["PORT_TO_PORT", "PORT_TO_DOOR"]

export function getServiceMeta(serviceType: ServiceType): ServiceTypeMeta {
  return SERVICE_TYPE_META[serviceType]
}

/** Titik asal tunggal untuk seluruh layanan MVP (PRD §5.2). */
export const ORIGIN = {
  code: "CGK",
  name: "Bandara Soekarno-Hatta",
  city: "Tangerang",
} as const

/** Batas yang dicerminkan dari aturan bisnis PRD §8.2. */
export const SHIPMENT_LIMITS = {
  maxWeightKg: 1000,
  maxColli: 100,
  maxUploadBytes: 5 * 1024 * 1024,
  acceptedUploadTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ] as string[],
  paymentDueHours: 72,
} as const
