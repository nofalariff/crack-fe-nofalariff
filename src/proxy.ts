import { NextResponse, type NextRequest } from "next/server"

import { ACCESS_TOKEN_COOKIE, readClaims } from "@/lib/auth/session"

/**
 * Pemeriksaan optimistis sebelum request sampai ke halaman.
 *
 * Sejak Next.js 16 berkas ini bernama `proxy.ts` (dulu `middleware.ts`).
 *
 * PENTING: ini hanya lapisan kenyamanan agar pengguna tidak melihat halaman
 * kosong lalu dialihkan. Otorisasi sebenarnya tetap ditegakkan backend pada
 * setiap endpoint (PRD §11.3, NFR-SEC-04), dan status approval agent dibaca
 * dari backend — bukan dari klaim token di sini.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/kirim",
  "/kiriman",
  "/penerima",
  "/profil",
  "/status-pengajuan",
]

const AUTH_ROUTES = ["/masuk", "/daftar"]

/** Area operasional — hanya untuk role ADMIN. */
const ADMIN_PREFIX = "/admin"

/** Tujuan setelah login, berbeda antara staf internal dan customer. */
function homeFor(role: string | undefined): string {
  return role === "ADMIN" ? ADMIN_PREFIX : "/dashboard"
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const claims = readClaims(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)

  const isCustomerArea = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  const isAdminArea =
    pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)
  const isProtected = isCustomerArea || isAdminArea
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isProtected && !claims) {
    const url = request.nextUrl.clone()
    url.pathname = "/masuk"
    url.search = ""
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Admin punya panel sendiri — jauhkan dari area customer.
  if (isCustomerArea && claims?.role === "ADMIN") {
    const url = request.nextUrl.clone()
    url.pathname = ADMIN_PREFIX
    url.search = ""
    return NextResponse.redirect(url)
  }

  // Sebaliknya, customer dan agen tidak punya urusan di area operasional.
  if (isAdminArea && claims && claims.role !== "ADMIN") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && claims) {
    const url = request.nextUrl.clone()
    url.pathname = homeFor(claims.role)
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Lewati aset statis dan berkas publik agar proxy tidak berjalan sia-sia
     * pada setiap permintaan gambar/font.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
