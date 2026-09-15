import { HttpResponse } from "msw"

import type { ApiErrorCode, PaginationMeta } from "@/types/api"

import { db, findUserById, type MockShipment, type MockUser } from "../db"

/** Prefiks yang dicocokkan seluruh handler; sepadan dengan API_URL apa pun. */
export const API = "*/api/v1"

// === Envelope (PRD §10.1) ===

export function ok<T>(data: T, meta?: PaginationMeta, status = 200) {
  return HttpResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status }
  )
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Array<{ field: string; message: string }>
) {
  return HttpResponse.json(
    {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
    },
    { status }
  )
}

export function unauthorized() {
  return fail("UNAUTHORIZED", "Sesi Anda sudah berakhir.", 401)
}

export function forbidden() {
  return fail("FORBIDDEN", "Anda tidak memiliki akses ke data ini.", 403)
}

export function notFound(message = "Data tidak ditemukan.") {
  return fail("NOT_FOUND", message, 404)
}

// === Token tiruan ===

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export const ACCESS_TTL_SECONDS = 15 * 60

/** JWT tiruan tanpa tanda tangan — cukup untuk pemeriksaan optimistis di proxy. */
function issueAccessToken(user: MockUser): string {
  const header = base64url({ alg: "none", typ: "JWT" })
  const payload = base64url({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS,
  })
  return `${header}.${payload}.mock`
}

function issueRefreshToken(user: MockUser): string {
  return `refresh.${user.id}.${Math.random().toString(36).slice(2, 10)}`
}

export function tokensFor(user: MockUser) {
  return {
    accessToken: issueAccessToken(user),
    refreshToken: issueRefreshToken(user),
    expiresIn: ACCESS_TTL_SECONDS,
  }
}

export function userFromRequest(request: Request): MockUser | null {
  const header = request.headers.get("Authorization")
  if (!header?.startsWith("Bearer ")) return null

  const [, payload] = header.slice(7).split(".")
  if (!payload) return null

  try {
    const decoded = JSON.parse(
      Buffer.from(
        payload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString()
    ) as { sub?: string; exp?: number }

    if (!decoded.sub) return null
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null

    return findUserById(decoded.sub) ?? null
  } catch {
    return null
  }
}

/**
 * Otorisasi role admin ditegakkan di sini, bukan hanya disembunyikan di UI
 * (NFR-SEC-04). Mengembalikan user bila sah, atau respons penolakan yang siap
 * dikembalikan handler.
 */
export function requireAdmin(
  request: Request
): { user: MockUser } | { response: ReturnType<typeof fail> } {
  const user = userFromRequest(request)
  if (!user) return { response: unauthorized() }
  if (user.role !== "ADMIN") return { response: forbidden() }
  return { user }
}

/** Agent hanya boleh membuat booking setelah disetujui (PRD FR-AGENT-02). */
export function isBookingAllowed(user: MockUser): boolean {
  if (user.role !== "AGENT") return true
  return user.agentProfile?.approvalStatus === "APPROVED"
}

export function shipmentsOf(user: MockUser): MockShipment[] {
  return db.shipments.filter((shipment) => shipment.userId === user.id)
}

/** Paginasi seragam untuk seluruh endpoint daftar (NFR-PERF-03). */
export function paginate<T>(
  rows: T[],
  page: number,
  limit: number
): { pageRows: T[]; meta: PaginationMeta } {
  const total = rows.length
  const start = (page - 1) * limit

  return {
    pageRows: rows.slice(start, start + limit),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}
