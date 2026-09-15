import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { LoginForm } from "@/components/auth/login-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke akun LogiSend untuk membuat booking dan memantau kiriman.",
}

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const params = await searchParams
  const next = typeof params.next === "string" ? params.next : undefined
  const terdaftar =
    typeof params.terdaftar === "string" ? params.terdaftar : undefined
  const passwordUpdated = params.password === "diperbarui"

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <h1 className="font-heading text-2xl leading-snug font-medium">
            Masuk
          </h1>
          <p className="text-muted-foreground text-sm">
            Gunakan email dan password akun LogiSend Anda.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {terdaftar && (
            <Alert>
              <CheckCircle2 aria-hidden />
              <AlertTitle>Pendaftaran berhasil</AlertTitle>
              <AlertDescription>
                {terdaftar === "agen"
                  ? "Akun agen Anda sudah dibuat dan sedang menunggu persetujuan admin. Silakan masuk untuk memantau status pengajuan."
                  : "Akun Anda sudah dibuat. Silakan masuk menggunakan email dan password tersebut."}
              </AlertDescription>
            </Alert>
          )}

          {passwordUpdated && (
            <Alert>
              <CheckCircle2 aria-hidden />
              <AlertTitle>Password diperbarui</AlertTitle>
              <AlertDescription>
                Demi keamanan, seluruh sesi Anda diakhiri. Silakan masuk dengan
                password baru.
              </AlertDescription>
            </Alert>
          )}

          <LoginForm next={next} />

          <div className="space-y-2 border-t pt-5 text-sm">
            <p className="text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/daftar"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Daftar perorangan
              </Link>
            </p>
            <p className="text-muted-foreground">
              Punya usaha pengiriman?{" "}
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
