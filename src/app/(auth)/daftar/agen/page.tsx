import type { Metadata } from "next"
import Link from "next/link"

import { RegisterAgentForm } from "@/components/auth/register-agent-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Daftar Agen",
  description:
    "Daftarkan usaha Anda sebagai agen LogiSend untuk mengelola pengiriman rutin dalam jumlah banyak.",
}

export default function DaftarAgenPage() {
  return (
    <div className="w-full max-w-xl">
      <Card>
        <CardHeader>
          <h1 className="font-heading text-2xl leading-snug font-medium">
            Daftar sebagai Agen
          </h1>
          <p className="text-muted-foreground text-sm">
            Untuk mitra dan reseller yang mengirim secara rutin. Nikmati buku
            alamat penerima tersimpan dan rekap seluruh kiriman dalam satu
            halaman.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegisterAgentForm />

          <p className="text-muted-foreground border-t pt-5 text-sm">
            Sudah punya akun?{" "}
            <Link
              href="/masuk"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
