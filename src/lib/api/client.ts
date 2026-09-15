import "server-only"

import { env } from "@/env"
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getAccessToken,
  getRefreshToken,
  isExpired,
  readClaims,
} from "@/lib/auth/session"
import type { ApiResponse, AuthTokens, PaginationMeta } from "@/types/api"

import { ApiError, UnauthorizedError } from "./errors"

/**
 * Klien HTTP ke backend LogiSend. Hanya boleh dipanggil dari server
 * (Server Component / Server Action) supaya token tidak pernah sampai ke
 * browser dan tidak ada panggilan lintas origin dari sisi klien.
 */

type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  /** Kirim sebagai multipart (unggah berkas) alih-alih JSON. */
  formData?: FormData
  /** Sertakan Authorization header. Default: true. */
  auth?: boolean
  query?: Record<string, string | number | undefined | null>
  /** Diteruskan ke fetch Next.js untuk kebutuhan caching. */
  cache?: RequestCache
  revalidate?: number | false
  tags?: string[]
}

/**
 * Pastikan mock aktif sebelum request pertama di graf modul ini.
 * Tidak melakukan apa pun saat NEXT_PUBLIC_API_MOCKING=disabled.
 */
async function ensureMocksReady(): Promise<void> {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return
  const { ensureMockServer } = await import("@/mocks/enable")
  await ensureMockServer()
}

function buildUrl(path: string, query?: FetchOptions["query"]): string {
  const url = new URL(
    path.startsWith("/") ? path.slice(1) : path,
    env.API_URL.endsWith("/") ? env.API_URL : `${env.API_URL}/`
  )

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

/**
 * Tukar refresh token dengan pasangan token baru.
 *
 * Penulisan cookie hanya berhasil di Server Action / Route Handler. Saat
 * dipanggil di tengah render Server Component, Next.js menolak penulisan
 * cookie — kasus itu ditangani sebagai sesi berakhir supaya pengguna diarahkan
 * ke halaman masuk, bukan melihat error.
 */
async function refreshTokens(refreshToken: string): Promise<string> {
  await ensureMocksReady()

  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })

  const payload = (await response.json()) as ApiResponse<AuthTokens>

  if (!response.ok || !payload.success) {
    throw new UnauthorizedError()
  }

  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const claims = readClaims(payload.data.accessToken)

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  }

  try {
    cookieStore.set(ACCESS_TOKEN_COOKIE, payload.data.accessToken, {
      ...options,
      maxAge: payload.data.expiresIn || 15 * 60,
    })
    cookieStore.set(REFRESH_TOKEN_COOKIE, payload.data.refreshToken, {
      ...options,
      maxAge: 7 * 24 * 60 * 60,
    })
  } catch {
    // Konteks render bersifat read-only untuk cookie. Token baru tetap dipakai
    // untuk request ini; penyegaran permanen terjadi pada aksi berikutnya.
    void claims
  }

  return payload.data.accessToken
}

async function resolveAccessToken(): Promise<string | undefined> {
  const accessToken = await getAccessToken()
  const claims = readClaims(accessToken)

  if (accessToken && !isExpired(claims)) return accessToken

  const refreshToken = await getRefreshToken()
  if (!refreshToken) return accessToken

  return refreshTokens(refreshToken)
}

async function request(
  path: string,
  options: FetchOptions,
  token: string | undefined
): Promise<Response> {
  await ensureMocksReady()

  const headers: Record<string, string> = { Accept: "application/json" }

  if (token) headers.Authorization = `Bearer ${token}`
  if (!options.formData) headers["Content-Type"] = "application/json"

  const next =
    options.revalidate !== undefined || options.tags
      ? { revalidate: options.revalidate, tags: options.tags }
      : undefined

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body:
      options.formData ??
      (options.body ? JSON.stringify(options.body) : undefined),
    cache: options.cache ?? (next ? undefined : "no-store"),
    ...(next ? { next } : {}),
  })
}

/**
 * Panggil endpoint API dan kembalikan `data` dari envelope.
 * Melempar `ApiError` (atau `UnauthorizedError`) bila backend menolak.
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const useAuth = options.auth !== false
  let token = useAuth ? await resolveAccessToken() : undefined

  let response = await request(path, options, token)

  // Satu kali percobaan refresh bila backend tetap menolak token.
  if (response.status === 401 && useAuth) {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) throw new UnauthorizedError()

    token = await refreshTokens(refreshToken)
    response = await request(path, options, token)
  }

  let payload: ApiResponse<T>
  try {
    payload = (await response.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(
      "INTERNAL_ERROR",
      "Respons dari server tidak dapat dibaca.",
      response.status
    )
  }

  if (!payload.success) {
    // 401 hanya berarti "sesi berakhir" untuk request yang memang membawa
    // token. Pada endpoint tanpa autentikasi seperti login, 401 adalah jawaban
    // domain (kredensial salah) dan harus sampai apa adanya ke pemanggil.
    if (response.status === 401 && useAuth) {
      throw new UnauthorizedError(payload.error.message)
    }

    throw new ApiError(
      payload.error.code,
      payload.error.message,
      response.status,
      payload.error.details
    )
  }

  return payload.data
}

/** Varian yang juga mengembalikan `meta` untuk endpoint berpaginasi. */
export async function apiFetchList<T>(
  path: string,
  options: FetchOptions = {}
): Promise<{ data: T; meta?: PaginationMeta }> {
  const useAuth = options.auth !== false
  let token = useAuth ? await resolveAccessToken() : undefined

  let response = await request(path, options, token)

  if (response.status === 401 && useAuth) {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) throw new UnauthorizedError()
    token = await refreshTokens(refreshToken)
    response = await request(path, options, token)
  }

  const payload = (await response.json()) as ApiResponse<T>

  if (!payload.success) {
    if (response.status === 401 && useAuth) {
      throw new UnauthorizedError(payload.error.message)
    }
    throw new ApiError(
      payload.error.code,
      payload.error.message,
      response.status,
      payload.error.details
    )
  }

  return { data: payload.data, meta: payload.meta }
}
