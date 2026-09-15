import type { Metadata } from "next"
import { AlertTriangle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PROHIBITED_ITEMS } from "@/lib/constants/prohibited-items"
import { ORIGIN, SHIPMENT_LIMITS } from "@/lib/constants/service-type"

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Ketentuan pengiriman, pembayaran, pembatalan, dan daftar barang terlarang pada layanan LogiSend.",
}

export default function SyaratKetentuanPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Syarat &amp; Ketentuan
      </h1>
      <p className="text-muted-foreground mt-3">
        Dengan membuat booking di LogiSend, Anda menyetujui ketentuan berikut.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          1. Ketentuan Pengiriman
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            Seluruh pengiriman berangkat dari counter kargo {ORIGIN.name} (
            {ORIGIN.code}). Barang diantar sendiri oleh pengirim ke gudang kami.
          </li>
          <li>
            Berat yang menjadi dasar tagihan adalah berat hasil penimbangan di
            gudang, dibulatkan ke atas ke kelipatan 1 kg, dan sekurang-kurangnya
            sama dengan berat minimum rute.
          </li>
          <li>
            Berat maksimum {SHIPMENT_LIMITS.maxWeightKg} kg dan maksimum{" "}
            {SHIPMENT_LIMITS.maxColli} koli untuk satu nomor resi. Kiriman lebih
            besar dari itu perlu dipecah menjadi beberapa booking.
          </li>
          <li>
            Estimasi lama pengiriman dihitung dalam hari kerja dan dapat berubah
            mengikuti jadwal penerbangan serta kondisi operasional maskapai.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">2. Pembayaran</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            Pembayaran dilakukan melalui transfer bank ke rekening resmi
            LogiSend yang tertera pada halaman invoice.
          </li>
          <li>
            Setelah transfer, pengirim wajib mengunggah bukti pembayaran untuk
            diverifikasi admin. Kiriman diproses setelah pembayaran
            terverifikasi.
          </li>
          <li>
            Batas waktu pembayaran adalah {SHIPMENT_LIMITS.paymentDueHours} jam
            sejak booking dibuat.
          </li>
          <li>
            Bila hasil penimbangan di gudang lebih berat daripada berat yang
            dideklarasikan, selisih tagihan menjadi tanggung jawab pengirim.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          3. Pembatalan &amp; Perubahan
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            Pembatalan mandiri hanya dapat dilakukan selama kiriman masih
            berstatus <strong>Menunggu Pembayaran</strong>.
          </li>
          <li>
            Perubahan data penerima dan keterangan barang dapat dilakukan
            sebelum barang diterima di gudang.
          </li>
          <li>
            Setelah kiriman berstatus <strong>Dalam Perjalanan</strong>,
            pembatalan tidak dapat diproses melalui sistem. Silakan hubungi tim
            operasional kami.
          </li>
          <li>
            Pengembalian dana atas pembatalan setelah pembayaran terverifikasi
            diproses secara manual oleh tim kami.
          </li>
        </ul>
      </section>

      <section className="mt-10 scroll-mt-20" id="barang-terlarang">
        <h2 className="text-xl font-semibold tracking-tight">
          4. Barang Terlarang
        </h2>

        <Alert variant="destructive" className="mt-4">
          <AlertTriangle aria-hidden />
          <AlertTitle>Dilarang dikirim</AlertTitle>
          <AlertDescription>
            Barang berikut tidak dapat diangkut melalui kargo udara. Pengirim
            bertanggung jawab penuh atas isi kiriman yang dideklarasikan.
          </AlertDescription>
        </Alert>

        <ul className="mt-4 space-y-3">
          {PROHIBITED_ITEMS.map((item) => (
            <li key={item.title} className="rounded-lg border p-4">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Contoh: {item.examples}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          5. Tanggung Jawab
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            Pengirim wajib mengemas barang dengan layak sesuai jenis dan
            sifatnya.
          </li>
          <li>
            LogiSend berhak menolak atau menahan kiriman yang tidak sesuai
            deklarasi atau melanggar regulasi penerbangan sipil.
          </li>
          <li>
            Nilai barang yang dicantumkan saat booking digunakan sebagai
            keterangan dan tidak otomatis berarti pertanggungan asuransi.
          </li>
        </ul>
      </section>
    </div>
  )
}
