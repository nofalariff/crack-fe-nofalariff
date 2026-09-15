import type { Metadata } from "next"

import { RateCalculator } from "@/components/rate/rate-calculator"
import { getRoutes } from "@/lib/api/endpoints"
import { ORIGIN } from "@/lib/constants/service-type"

export const metadata: Metadata = {
  title: "Cek Ongkir",
  description:
    "Hitung estimasi ongkos kirim kargo udara LogiSend dari Bandara Soekarno-Hatta ke Sulawesi dan Pulau Jawa. Tanpa perlu membuat akun.",
}

export default async function CekOngkirPage() {
  const routes = await getRoutes()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Cek Ongkir</h1>
        <p className="text-muted-foreground mt-3">
          Hitung perkiraan biaya pengiriman dari {ORIGIN.name} ({ORIGIN.code})
          tanpa perlu membuat akun terlebih dahulu.
        </p>
      </div>

      <div className="mt-8">
        <RateCalculator routes={routes} />
      </div>
    </div>
  )
}
