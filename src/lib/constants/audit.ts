import type { AuditAction } from "@/types/api"

/**
 * Terjemahan aksi audit ke bahasa manusia (FR-ADM-05).
 * Satu-satunya tempat kode aksi diterjemahkan.
 */
export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  SHIPMENT_STATUS_CHANGED: "Status kiriman diubah",
  SHIPMENT_WEIGHT_CORRECTED: "Berat kiriman dikoreksi",
  SHIPMENT_CREATED_BY_ADMIN: "Kiriman dibuat admin",
  PAYMENT_VERIFIED: "Pembayaran diverifikasi",
  PAYMENT_REJECTED: "Pembayaran ditolak",
  AGENT_APPROVED: "Agen disetujui",
  AGENT_REJECTED: "Agen ditolak",
  USER_STATUS_CHANGED: "Status akun diubah",
  ROUTE_CREATED: "Rute ditambahkan",
  ROUTE_UPDATED: "Rute diubah",
  RATE_UPDATED: "Tarif diubah",
}

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]

/** Label kolom nilai sebelum/sesudah agar tidak menampilkan nama field mentah. */
export const AUDIT_FIELD_LABEL: Record<string, string> = {
  status: "Status",
  approvalStatus: "Status pengajuan",
  actualWeight: "Berat timbang",
  chargeableWeight: "Berat dikenakan",
  totalAmount: "Total tagihan",
  pricePerKg: "Harga per kg",
  minChargeableWeight: "Berat minimum",
  baseFee: "Biaya dasar",
  destinationCode: "Kode tujuan",
  destinationName: "Nama tujuan",
  estimatedDays: "Estimasi hari",
  isActive: "Aktif",
  reason: "Alasan",
  amount: "Nominal",
  customer: "Customer",
  total: "Total",
}

export function auditFieldLabel(key: string): string {
  return AUDIT_FIELD_LABEL[key] ?? key
}
