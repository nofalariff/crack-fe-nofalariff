import type { Metadata } from "next"
import Link from "next/link"
import { Construction } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Panel Admin" }

/** Fitur panel admin sesuai PRD §7.7 — belum dikerjakan di fase ini. */
const PLANNED_FEATURES = [
  {
    title: "Daftar seluruh kiriman",
    note: "Filter, pencarian, dan aksi massal",
  },
  { title: "Update status kiriman", note: "Satuan maupun massal per rute" },
  { title: "Verifikasi pembayaran", note: "Antrean bukti transfer masuk" },
  { title: "Approval agen", note: "Setujui atau tolak pengajuan mitra B2B" },
  {
    title: "Kelola rute & tarif",
    note: "Master data tanpa perlu deploy ulang",
  },
  { title: "Cetak label & manifest", note: "Label 100×150 mm dan manifest A4" },
]

export default async function AdminPage() {
  const user = await requireUser("/admin")
  const firstName = user.fullName.split(" ")[0]

  return (
    <>
      <PageHeader
        title={`Halo, ${firstName}`}
        description="Area operasional LogiSend."
      />

      <Alert>
        <Construction aria-hidden />
        <AlertTitle>Panel admin sedang dibangun</AlertTitle>
        <AlertDescription>
          Fase pengerjaan saat ini mencakup halaman publik dan dashboard
          customer. Panel operasional dikerjakan pada fase berikutnya — akun ini
          sudah aktif dan siap dipakai begitu panelnya tersedia.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Yang akan tersedia di sini</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {PLANNED_FEATURES.map((feature) => (
              <li key={feature.title} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {feature.note}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sementara ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Halaman publik tetap dapat diakses untuk memeriksa tarif dan cakupan
            rute yang sedang berlaku.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/cek-ongkir">Cek Ongkir</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/layanan">Cakupan Rute</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
