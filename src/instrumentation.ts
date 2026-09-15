/**
 * Menyalakan mock MSW saat backend belum tersedia.
 *
 * Hanya berjalan di runtime Node.js — proxy berjalan di runtime edge dan memang
 * tidak boleh memanggil API (PRD §11.3). Saat backend asli siap, cukup set
 * NEXT_PUBLIC_API_MOCKING=disabled; tidak ada kode aplikasi yang berubah.
 */
export async function register() {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { server } = await import("./mocks/server")

  server.listen({ onUnhandledRequest: "bypass" })
  console.info(
    "[LogiSend] Mock API (MSW) aktif — backend asli tidak dipanggil."
  )
}
