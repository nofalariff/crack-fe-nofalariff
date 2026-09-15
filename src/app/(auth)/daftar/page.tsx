import type { Metadata } from "next"
import Link from "next/link"

import { RegisterCustomerForm } from "@/components/auth/register-customer-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Daftar Akun",
  description:
    "Buat akun LogiSend untuk membuat booking pengiriman dan memantau status kiriman Anda.",
}

export default function DaftarPage() {
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <h1 className="font-heading text-2xl leading-snug font-medium">
            Daftar Akun
          </h1>
          <p className="text-muted-foreground text-sm">
            Untuk pengirim perorangan. Akun langsung aktif setelah pendaftaran.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <RegisterCustomerForm />

          <div className="space-y-2 border-t pt-5 text-sm">
            <p className="text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/masuk"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
            <p className="text-muted-foreground">
              Mengirim dalam jumlah banyak?{" "}
              <Link
                href="/daftar/agen"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Daftar sebagai agen
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
