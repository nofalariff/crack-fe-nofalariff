import Link from "next/link"
import {
  ArrowRight,
  Calculator,
  ClipboardCheck,
  MapPin,
  PackageSearch,
  Truck,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRoutes } from "@/lib/api/endpoints"
import { formatEstimatedDays } from "@/lib/format"
import {
  ORIGIN,
  SERVICE_TYPES,
  getServiceMeta,
} from "@/lib/constants/service-type"
import type { ServiceType } from "@/types/api"

const STEPS = [
  {
    icon: Calculator,
    title: "Cek ongkir",
    description:
      "Pilih layanan, tujuan, dan berat barang untuk melihat estimasi biaya sebelum memutuskan.",
  },
  {
    icon: ClipboardCheck,
    title: "Buat booking",
    description:
      "Isi data penerima dan barang. Nomor resi langsung terbit setelah booking dibuat.",
  },
  {
    icon: Wallet,
    title: "Bayar & unggah bukti",
    description:
      "Transfer sesuai tagihan, lalu unggah bukti transfer untuk diverifikasi tim kami.",
  },
  {
    icon: Truck,
    title: "Antar & pantau",
    description: `Antar barang ke gudang kami di ${ORIGIN.code}, lalu pantau status kiriman dari dashboard.`,
  },
]

const FAQ = [
  {
    question: "Apakah barang dijemput dari alamat saya?",
    answer: `Belum. Untuk saat ini barang diantar sendiri ke counter kargo LogiSend di ${ORIGIN.name} (${ORIGIN.code}).`,
  },
  {
    question: "Bagaimana cara membayarnya?",
    answer:
      "Pembayaran dilakukan lewat transfer bank ke rekening LogiSend. Setelah transfer, unggah bukti pembayaran pada halaman kiriman Anda untuk diverifikasi admin.",
  },
  {
    question: "Apakah ongkir yang ditampilkan sudah final?",
    answer:
      "Hasil kalkulator bersifat estimasi. Biaya final ditentukan setelah barang ditimbang ulang di gudang kami.",
  },
  {
    question: "Bagaimana saya memantau kiriman?",
    answer:
      "Status kiriman dapat dilihat kapan saja di dashboard setelah Anda masuk ke akun LogiSend.",
  },
]

export default async function LandingPage() {
  const routes = await getRoutes()

  const routesByService = SERVICE_TYPES.reduce<
    Record<ServiceType, typeof routes>
  >(
    (acc, serviceType) => {
      acc[serviceType] = routes.filter(
        (route) => route.serviceType === serviceType
      )
      return acc
    },
    { PORT_TO_PORT: [], PORT_TO_DOOR: [] }
  )

  return (
    <>
      {/* Hero */}
      <section className="from-primary/5 to-background border-b bg-gradient-to-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="bg-background text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
              <MapPin className="size-3.5" aria-hidden />
              Berangkat dari {ORIGIN.name} ({ORIGIN.code})
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Kirim kargo udara tanpa perlu chat berulang
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Cek ongkir sendiri, buat booking dalam beberapa menit, dan pantau
              status kiriman Anda kapan saja — semuanya dari satu halaman.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/cek-ongkir">
                  <Calculator aria-hidden />
                  Cek Ongkir
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/daftar">
                  Buat Akun
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Layanan */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Dua pilihan layanan
        </h2>
        <p className="text-muted-foreground mt-2">
          Pilih sesuai kebutuhan penerima barang Anda.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {SERVICE_TYPES.map((serviceType) => {
            const meta = getServiceMeta(serviceType)
            const Icon = meta.icon
            const serviceRoutes = routesByService[serviceType]

            return (
              <Card key={serviceType} className="flex flex-col">
                <CardHeader>
                  <span className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <CardTitle className="text-xl">{meta.label}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {meta.shortLabel}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="text-sm">{meta.description}</p>
                  <p className="bg-muted/60 text-muted-foreground rounded-lg p-3 text-sm">
                    {meta.endpointNote}
                  </p>

                  <div className="mt-auto">
                    <h3 className="text-sm font-medium">
                      Tujuan yang dilayani
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {serviceRoutes.map((route) => (
                        <li
                          key={route.id}
                          className="bg-background rounded-full border px-3 py-1 text-xs"
                        >
                          {route.destinationName}
                          <span className="text-muted-foreground">
                            {" · "}
                            {formatEstimatedDays(route.estimatedDays)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Cara kerja */}
      <section className="bg-muted/30 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Cara kerja</h2>
          <p className="text-muted-foreground mt-2">
            Empat langkah dari cek ongkir sampai barang diterima.
          </p>

          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <li key={step.title} className="relative">
                  <span className="bg-background text-primary flex size-10 items-center justify-center rounded-lg shadow-sm">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-medium">
                    <span className="text-muted-foreground">{index + 1}. </span>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-sm">
                    {step.description}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Pertanyaan yang sering diajukan
        </h2>

        <dl className="mt-8 grid gap-6 md:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.question} className="rounded-xl border p-5">
              <dt className="font-medium">{item.question}</dt>
              <dd className="text-muted-foreground mt-2 text-sm">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA penutup */}
      <section className="bg-primary text-primary-foreground border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Siap mengirim barang?
            </h2>
            <p className="text-primary-foreground/80 mt-2">
              Buat akun gratis dan booking pengiriman pertama Anda hari ini.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href="/daftar">
                <PackageSearch aria-hidden />
                Daftar Perorangan
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent"
            >
              <Link href="/daftar/agen">Daftar sebagai Agen</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
