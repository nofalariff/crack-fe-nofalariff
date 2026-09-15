import "server-only"

import { cache } from "react"

import type {
  AdminDashboardSummary,
  AdminRoute,
  AdminShipmentDetail,
  AdminShipmentListParams,
  AdminShipmentSummary,
  AdminUser,
  AdminUserDetail,
  AgentListItem,
  ApprovalStatus,
  AuditAction,
  AuditLogEntry,
  BulkStatusRequest,
  BulkStatusResult,
  PaginationMeta,
  PaymentQueueItem,
  PaymentRecordStatus,
  RateRequest,
  RouteRequest,
  UpdateStatusRequest,
  UserRole,
  UserStatus,
  WalkInShipmentRequest,
  WeightCorrectionRequest,
  WeightCorrectionResult,
} from "@/types/api"

import { apiFetch, apiFetchList } from "./client"

/**
 * Lapisan akses data operasional — satu fungsi per endpoint PRD §10 kelompok
 * `/admin`. `cache()` memoize hasil selama satu render agar beberapa komponen
 * boleh meminta data yang sama tanpa request ganda.
 */

// === Dashboard ===

export const getAdminDashboard = cache(
  async (): Promise<AdminDashboardSummary> => {
    return apiFetch<AdminDashboardSummary>("/admin/dashboard")
  }
)

// === Kiriman ===

export const getAdminShipments = cache(
  async (
    params: AdminShipmentListParams = {}
  ): Promise<{ data: AdminShipmentSummary[]; meta?: PaginationMeta }> => {
    return apiFetchList<AdminShipmentSummary[]>("/admin/shipments", {
      query: params,
    })
  }
)

export const getAdminShipment = cache(
  async (key: string): Promise<AdminShipmentDetail> => {
    return apiFetch<AdminShipmentDetail>(
      `/admin/shipments/${encodeURIComponent(key)}`
    )
  }
)

export async function updateShipmentStatus(
  id: string,
  input: UpdateStatusRequest
): Promise<AdminShipmentDetail> {
  return apiFetch<AdminShipmentDetail>(`/admin/shipments/${id}/status`, {
    method: "POST",
    body: input,
  })
}

export async function bulkUpdateStatus(
  input: BulkStatusRequest
): Promise<BulkStatusResult> {
  return apiFetch<BulkStatusResult>("/admin/shipments/bulk-status", {
    method: "POST",
    body: input,
  })
}

export async function correctShipmentWeight(
  id: string,
  input: WeightCorrectionRequest
): Promise<WeightCorrectionResult> {
  return apiFetch<WeightCorrectionResult>(`/admin/shipments/${id}/weight`, {
    method: "PATCH",
    body: input,
  })
}

export async function createWalkInShipment(
  input: WalkInShipmentRequest
): Promise<AdminShipmentDetail> {
  return apiFetch<AdminShipmentDetail>("/admin/shipments", {
    method: "POST",
    body: input,
  })
}

// === Pembayaran ===

export const getPaymentQueue = cache(
  async (
    params: {
      status?: PaymentRecordStatus | "ALL"
      page?: number
      limit?: number
    } = {}
  ): Promise<{ data: PaymentQueueItem[]; meta?: PaginationMeta }> => {
    return apiFetchList<PaymentQueueItem[]>("/admin/payments", {
      query: params,
    })
  }
)

export async function verifyPayment(
  paymentId: string
): Promise<AdminShipmentDetail> {
  return apiFetch<AdminShipmentDetail>(`/admin/payments/${paymentId}/verify`, {
    method: "POST",
  })
}

export async function rejectPayment(
  paymentId: string,
  reason: string
): Promise<AdminShipmentDetail> {
  return apiFetch<AdminShipmentDetail>(`/admin/payments/${paymentId}/reject`, {
    method: "POST",
    body: { reason },
  })
}

// === Agen ===

export const getAgents = cache(
  async (
    params: { status?: ApprovalStatus; page?: number; limit?: number } = {}
  ): Promise<{ data: AgentListItem[]; meta?: PaginationMeta }> => {
    return apiFetchList<AgentListItem[]>("/admin/agents", { query: params })
  }
)

export async function approveAgent(userId: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/agents/${userId}/approve`, {
    method: "POST",
  })
}

export async function rejectAgent(
  userId: string,
  reason: string
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/agents/${userId}/reject`, {
    method: "POST",
    body: { reason },
  })
}

// === Pengguna ===

export const getAdminUsers = cache(
  async (
    params: {
      role?: UserRole
      status?: UserStatus
      search?: string
      page?: number
      limit?: number
    } = {}
  ): Promise<{ data: AdminUser[]; meta?: PaginationMeta }> => {
    return apiFetchList<AdminUser[]>("/admin/users", { query: params })
  }
)

export const getAdminUser = cache(
  async (id: string): Promise<AdminUserDetail> => {
    return apiFetch<AdminUserDetail>(`/admin/users/${id}`)
  }
)

export async function updateUserStatus(
  id: string,
  status: UserStatus
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: { status },
  })
}

// === Rute & tarif ===

export const getAdminRoutes = cache(async (): Promise<AdminRoute[]> => {
  return apiFetch<AdminRoute[]>("/admin/routes")
})

export async function createRoute(input: RouteRequest): Promise<AdminRoute> {
  return apiFetch<AdminRoute>("/admin/routes", { method: "POST", body: input })
}

export async function updateRoute(
  id: string,
  input: Partial<RouteRequest>
): Promise<AdminRoute> {
  return apiFetch<AdminRoute>(`/admin/routes/${id}`, {
    method: "PATCH",
    body: input,
  })
}

export async function updateRate(
  id: string,
  input: RateRequest
): Promise<AdminRoute> {
  return apiFetch<AdminRoute>(`/admin/routes/${id}/rate`, {
    method: "PUT",
    body: input,
  })
}

// === Audit log ===

export const getAuditLogs = cache(
  async (
    params: {
      action?: AuditAction
      dateFrom?: string
      dateTo?: string
      page?: number
      limit?: number
    } = {}
  ): Promise<{ data: AuditLogEntry[]; meta?: PaginationMeta }> => {
    return apiFetchList<AuditLogEntry[]>("/admin/audit-logs", { query: params })
  }
)
