import { NextResponse } from "next/server"

import { env } from "@/env"
import { getAccessToken } from "@/lib/auth/session"

// Jenis berkas yang diterima backend saat unggah bukti (planbackend.md §8.3).
// Apa pun selain ini tidak diteruskan dengan Content-Type aslinya, supaya
// berkas tak terduga (mis. HTML/SVG) tidak pernah dirender di origin ini.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
])
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

/**
 * Proxy berkas bukti pembayaran.
 *
 * Satu-satunya Route Handler di aplikasi ini. Alasannya konkret: atribut `src`
 * pada `<img>` adalah permintaan yang dibuat browser sendiri, dan browser tidak
 * pernah memegang token — token hidup di httpOnly cookie yang hanya terbaca di
 * server. Jadi permintaannya diteruskan dari sini dengan membawa token sesi,
 * sesuai NFR-SEC-07 (berkas tidak pernah tersaji lewat URL publik yang bisa
 * ditebak). Otorisasi sebenarnya tetap ditegakkan backend.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!ID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "Berkas tidak ditemukan" },
      { status: 404 }
    )
  }

  const token = await getAccessToken()

  if (!token) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
  }

  if (process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
    const { ensureMockServer } = await import("@/mocks/enable")
    await ensureMockServer()
  }

  const base = env.API_URL.endsWith("/") ? env.API_URL : `${env.API_URL}/`
  const upstream = await fetch(
    new URL(`files/${encodeURIComponent(id)}`, base),
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  )

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Berkas tidak dapat diambil" },
      { status: upstream.status }
    )
  }

  // Isi berkas dibaca penuh, bukan diteruskan sebagai stream: bukti pembayaran
  // berukuran kecil, dan meneruskan stream membuat server melempar error setiap
  // kali browser membatalkan permintaan gambar (misalnya saat pindah halaman).
  const body = await upstream.arrayBuffer()

  const upstreamType = (upstream.headers.get("Content-Type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase()
  const contentType = ALLOWED_TYPES.has(upstreamType)
    ? upstreamType
    : "application/octet-stream"

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": ALLOWED_TYPES.has(upstreamType)
        ? "inline"
        : "attachment",
      "X-Content-Type-Options": "nosniff",
      // Bukti pembayaran bersifat pribadi — jangan disimpan cache bersama.
      "Cache-Control": "private, max-age=60",
    },
  })
}
