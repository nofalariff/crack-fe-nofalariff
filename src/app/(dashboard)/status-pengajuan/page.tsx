import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/dal"
import { formatDateTimeWIB, formatPhone } from "@/lib/format"

export const metadata: Metadata = { title: "Status Pengajuan Agen" }

export default async function StatusPengajuanPage() {
  const user = await requireUser("/status-pengajuan")

  // Halaman ini khusus akun agen.
  if (user.role !== "AGENT" || !user.agentProfile) {
    redirect("/dashboard")
  }

  const profile = user.agentProfile
  const details = [
    { label: "Nama perusahaan", value: profile.companyName },
    { label: "Alamat perusahaan", value: profile.companyAddress },
    { label: "Nama PIC", value: profile.picName },
    { label: "Nomor HP PIC", value: formatPhone(profile.picPhone) },
    { label: "NPWP", value: profile.npwp ?? "Tidak diisi" },
  ]

  return (
    <>
      <PageHeader
        title="Status Pengajuan Agen"
        description="Data perusahaan yang Anda ajukan beserta hasil peninjauannya."
      />

      {profile.approvalStatus === "PENDING" && (
        <Alert>
          <Clock aria-hidden />
          <AlertTitle>Sedang ditinjau</AlertTitle>
          <AlertDescription>
            Tim LogiSend sedang memeriksa data perusahaan Anda. Anda akan dapat
            membuat booking segera setelah pengajuan disetujui. Sementara itu,
            Anda tetap bisa menyiapkan buku alamat penerima.
          </AlertDescription>
        </Alert>
      )}

      {profile.approvalStatus === "REJECTED" && (
        <Alert variant="destructive">
          <XCircle aria-hidden />
          <AlertTitle>Pengajuan ditolak</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {profile.rejectionReason ??
                "Data perusahaan Anda belum dapat kami setujui."}
            </p>
            <p>
              Silakan perbaiki data perusahaan di halaman profil, lalu pengajuan
              Anda akan ditinjau ulang.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/profil">Perbaiki data perusahaan</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {profile.approvalStatus === "APPROVED" && (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertTitle>Pengajuan disetujui</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Akun agen Anda sudah aktif. Anda dapat membuat booking kapan saja.
            </p>
            <Button asChild size="sm">
              <Link href="/kirim">Buat booking</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data yang diajukan</CardTitle>
          {profile.reviewedAt && (
            <p className="text-muted-foreground text-sm">
              Ditinjau pada {formatDateTimeWIB(profile.reviewedAt)}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-3"
              >
                <dt className="text-muted-foreground text-sm">
                  {detail.label}
                </dt>
                <dd className="text-sm sm:col-span-2">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </>
  )
}
