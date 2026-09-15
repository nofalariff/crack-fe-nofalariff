import "server-only"

import { cookies } from "next/headers"
import { decodeJwt } from "jose"

import type { AuthTokens, UserRole } from "@/types/api"

/**
 * Sesi disimpan pada httpOnly cookie yang hanya ditulis dari server
 * (PRD §11.3, NFR-SEC-02). Browser tidak pernah memegang token, dan browser
 * tidak pernah memanggil backend secara langsung.
 */
export const ACCESS_TOKEN_COOKIE = "logisend_at"
export const REFRESH_TOKEN_COOKIE = "logisend_rt"

const ACCESS_MAX_AGE = 15 * 60 // 15 menit (NFR-SEC-02)
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 // 7 hari

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}

export type SessionClaims = {
  userId: string
  email: string
  role: UserRole
  /** Detik epoch. */
  exp: number
}

/** Tulis pasangan token hasil login/refresh ke cookie. */
export async function createSession(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn || ACCESS_MAX_AGE,
  })
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_MAX_AGE,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value
}

/**
 * Baca klaim dari access token tanpa memverifikasi tanda tangan.
 *
 * Ini sengaja — klaim hanya dipakai untuk keputusan tampilan dan pengalihan
 * rute (pemeriksaan optimistis). Otorisasi sebenarnya tetap ditegakkan backend
 * pada setiap endpoint (PRD §11.3, NFR-SEC-04).
 */
export function readClaims(token: string | undefined): SessionClaims | null {
  if (!token) return null

  try {
    const payload = decodeJwt(token)
    if (!payload.sub || !payload.role) return null

    return {
      userId: String(payload.sub),
      email: String(payload.email ?? ""),
      role: payload.role as UserRole,
      exp: Number(payload.exp ?? 0),
    }
  } catch {
    return null
  }
}

export async function getSessionClaims(): Promise<SessionClaims | null> {
  return readClaims(await getAccessToken())
}

/** Token sudah lewat masa berlaku (diberi jeda 30 detik). */
export function isExpired(claims: SessionClaims | null): boolean {
  if (!claims?.exp) return false
  return claims.exp * 1000 <= Date.now() + 30_000
}
