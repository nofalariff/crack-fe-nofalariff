/**
 * Menyalakan interceptor MSW secara idempoten.
 *
 * `instrumentation.ts` saja tidak cukup: Server Action dieksekusi pada graf
 * modul yang berbeda dari render Server Component, sehingga `fetch` di sana
 * belum ter-patch dan request-nya lolos ke jaringan nyata. Memanggil ini dari
 * jalur klien API memastikan interceptor selalu aktif, di jalur mana pun
 * request dibuat.
 *
 * Aman dipanggil berkali-kali — hanya menyalakan sekali per proses.
 */
let starting: Promise<void> | null = null

export function ensureMockServer(): Promise<void> {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled")
    return Promise.resolve()
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") {
    return Promise.resolve()
  }

  starting ??= import("./server").then(({ server }) => {
    server.listen({ onUnhandledRequest: "bypass" })
  })

  return starting
}
