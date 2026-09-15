import "server-only"

import { cache } from "react"

import type {
  CalculateRateRequest,
  CreateShipmentRequest,
  CurrentUser,
  DashboardSummary,
  Invoice,
  PaginationMeta,
  RateCalculation,
  Recipient,
  RecipientRequest,
  Route,
  ServiceType,
  Shipment,
  ShipmentListParams,
  ShipmentSummary,
  UpdateShipmentRequest,
} from "@/types/api"

import { apiFetch, apiFetchList } from "./client"

/**
 * Lapisan akses data: satu fungsi per endpoint PRD §10.
 *
 * `cache()` memoize hasil selama satu render pass sehingga beberapa komponen
 * boleh meminta data yang sama tanpa memicu request ganda.
 */

// === Profil pengguna ===

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  return apiFetch<CurrentUser>("/auth/me")
})

/** Varian yang mengembalikan null alih-alih melempar saat belum login. */
export const getCurrentUserSafe = cache(
  async (): Promise<CurrentUser | null> => {
    try {
      return await getCurrentUser()
    } catch {
      return null
    }
  }
)

// === Rute (publik) ===

export const getRoutes = cache(
  async (serviceType?: ServiceType): Promise<Route[]> => {
    return apiFetch<Route[]>("/routes", {
      auth: false,
      query: { serviceType },
      revalidate: 300,
    })
  }
)

export async function calculateRate(
  input: CalculateRateRequest
): Promise<RateCalculation> {
  return apiFetch<RateCalculation>("/rates/calculate", {
    method: "POST",
    body: input,
    auth: false,
  })
}

// === Kiriman ===

export const getShipments = cache(
  async (
    params: ShipmentListParams = {}
  ): Promise<{ data: ShipmentSummary[]; meta?: PaginationMeta }> => {
    return apiFetchList<ShipmentSummary[]>("/shipments", { query: params })
  }
)

export const getShipment = cache(
  async (trackingNumber: string): Promise<Shipment> => {
    return apiFetch<Shipment>(
      `/shipments/${encodeURIComponent(trackingNumber)}`
    )
  }
)

export async function createShipment(
  input: CreateShipmentRequest
): Promise<Shipment> {
  return apiFetch<Shipment>("/shipments", { method: "POST", body: input })
}

export async function updateShipment(
  id: string,
  input: UpdateShipmentRequest
): Promise<Shipment> {
  return apiFetch<Shipment>(`/shipments/${id}`, {
    method: "PATCH",
    body: input,
  })
}

export async function cancelShipment(
  id: string,
  reason?: string
): Promise<Shipment> {
  return apiFetch<Shipment>(`/shipments/${id}/cancel`, {
    method: "POST",
    body: { reason },
  })
}

// === Pembayaran ===

export const getInvoice = cache(
  async (trackingNumber: string): Promise<Invoice> => {
    return apiFetch<Invoice>(
      `/shipments/${encodeURIComponent(trackingNumber)}/invoice`
    )
  }
)

export async function uploadPaymentProof(
  shipmentId: string,
  formData: FormData
): Promise<Invoice> {
  return apiFetch<Invoice>(`/shipments/${shipmentId}/payments`, {
    method: "POST",
    formData,
  })
}

// === Buku alamat ===

export const getRecipients = cache(async (): Promise<Recipient[]> => {
  return apiFetch<Recipient[]>("/recipients")
})

export async function createRecipient(
  input: RecipientRequest
): Promise<Recipient> {
  return apiFetch<Recipient>("/recipients", { method: "POST", body: input })
}

export async function updateRecipient(
  id: string,
  input: RecipientRequest
): Promise<Recipient> {
  return apiFetch<Recipient>(`/recipients/${id}`, {
    method: "PATCH",
    body: input,
  })
}

export async function deleteRecipient(id: string): Promise<void> {
  await apiFetch<null>(`/recipients/${id}`, { method: "DELETE" })
}

// === Dashboard ===

export const getDashboardSummary = cache(
  async (): Promise<DashboardSummary> => {
    return apiFetch<DashboardSummary>("/dashboard/summary")
  }
)
