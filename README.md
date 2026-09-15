# LogiSend — Frontend

Antarmuka web LogiSend: jasa pengiriman kargo udara dari Bandara Soekarno-Hatta
(CGK) ke Sulawesi (port-to-port) dan seluruh Pulau Jawa (port-to-door).

Spesifikasi produk lengkap ada di [`PRD.md`](../PRD.md) pada folder induk. Setiap
keputusan di repo ini mengacu ke sana.

## Cakupan fase ini

Grup route `(public)`, `(auth)`, dan `(dashboard)` — dari landing page sampai
dashboard customer. **Panel admin dan halaman cetak label/manifest belum
dikerjakan** dan direncanakan sebagai fase terpisah.

| Area      | Halaman                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Publik    | Landing, Layanan, Cek Ongkir, Syarat & Ketentuan                                                                                                       |
| Auth      | Masuk, Daftar (B2C), Daftar Agen (B2B)                                                                                                                 |
| Dashboard | Ringkasan, Kirim Barang, Kiriman Saya, Detail & Linimasa Status, Invoice, Unggah Bukti Bayar, Ubah Kiriman, Buku Alamat, Profil, Status Pengajuan Agen |

## Menjalankan

```bash
bun install
cp .env.example .env.local
bun dev                       # http://localhost:3000
```

Backend belum dibangun, jadi secara bawaan aplikasi berjalan di atas **mock MSW**
yang meniru kontrak API PRD §10 — termasuk envelope response, paginasi, dan
seluruh kode error domain.

### Akun uji (tersedia saat mock aktif)

| Peran                       | Email                  | Password      |
| --------------------------- | ---------------------- | ------------- |
| Customer B2C                | `budi@example.com`     | `password123` |
| Agen (disetujui)            | `agen@example.com`     | `password123` |
| Agen (menunggu persetujuan) | `agenbaru@example.com` | `password123` |

Data mock bersifat **stateful selama proses server hidup**: booking yang dibuat
benar-benar muncul di daftar kiriman, dan unggahan bukti benar-benar mengubah
status pembayaran. Restart `bun dev` mengembalikannya ke data awal.

## Perintah

| Perintah            | Kegunaan                           |
| ------------------- | ---------------------------------- |
| `bun dev`           | Server pengembangan                |
| `bun run build`     | Build produksi                     |
| `bun run typecheck` | Pemeriksaan tipe TypeScript        |
| `bun run lint`      | ESLint                             |
| `bun run format`    | Prettier                           |
| `bun test`          | Unit test (Vitest)                 |
| `bun run test:e2e`  | E2E (Playwright, desktop + mobile) |

## Environment

| Variabel                  | Keterangan                                                       |
| ------------------------- | ---------------------------------------------------------------- |
| `API_URL`                 | URL backend. Hanya dipakai di server, tidak diekspos ke browser. |
| `NEXT_PUBLIC_APP_URL`     | URL publik aplikasi (metadata & Open Graph).                     |
| `NEXT_PUBLIC_APP_NAME`    | Nama aplikasi di UI.                                             |
| `NEXT_PUBLIC_API_MOCKING` | `enabled` \| `disabled` — menyalakan mock MSW.                   |

Nilainya divalidasi saat boot di [`src/env.ts`](src/env.ts); aplikasi menolak
jalan bila ada yang kosong atau salah format.

## Struktur

```
src/
├── app/
│   ├── (public)/      # landing, cek-ongkir, layanan, syarat-ketentuan
│   ├── (auth)/        # masuk, daftar, daftar/agen
│   └── (dashboard)/   # dashboard, kirim, kiriman, penerima, profil
├── components/
│   ├── ui/            # shadcn/ui (dikelola generator)
│   ├── layout/        # header, footer, sidebar, banner status agen
│   ├── booking/       # wizard booking + ringkasan biaya
│   ├── shipment/      # badge status, linimasa, filter, dialog
│   └── shared/        # field form, empty state, tombol submit
├── lib/
│   ├── api/           # klien HTTP + pemetaan error domain
│   ├── auth/          # sesi cookie, Server Action, akses sesi
│   ├── actions/       # Server Action per domain
│   ├── validations/   # skema Zod (cermin aturan backend)
│   ├── constants/     # status, layanan, navigasi, barang terlarang
│   └── format.ts      # rupiah, tanggal WIB, berat, nomor HP
├── mocks/             # MSW: data + handler kontrak API
├── types/api.ts       # tipe kontrak PRD §10
├── instrumentation.ts # menyalakan MSW di runtime server
└── proxy.ts           # guard rute (dulu bernama middleware.ts)
```

## Keputusan teknis penting

- **Next.js 16** — `middleware.ts` kini bernama `proxy.ts`, dan API request
  (`cookies()`, `params`, `searchParams`) bersifat async.
- **Browser tidak pernah memanggil backend langsung.** Seluruh request data
  berjalan lewat Server Component dan Server Action, sehingga token hidup di
  httpOnly cookie dan tidak ada persoalan CORS di sisi klien.
- **Otorisasi sebenarnya ada di backend.** `proxy.ts` hanya pemeriksaan
  optimistis agar pengguna tidak melihat halaman kosong sebelum dialihkan.
- **Status approval agen selalu dibaca dari backend**, bukan dari klaim token,
  supaya agen yang baru disetujui langsung bisa booking tanpa login ulang.
- **Filter daftar kiriman disimpan di URL**, bukan state komponen — hasilnya bisa
  di-bookmark, dibagikan, dan tahan refresh.
- **Label status kiriman hanya didefinisikan di satu tempat**
  ([`src/lib/constants/shipment-status.ts`](src/lib/constants/shipment-status.ts)).
  Jangan menulis label status langsung di komponen.
- **Estimasi vs final**: seluruh angka ongkir di UI diberi label estimasi, karena
  tagihan final ditentukan setelah penimbangan ulang di gudang.

## Beralih ke backend asli

1. Isi `API_URL` dengan alamat `logisend-api`.
2. Set `NEXT_PUBLIC_API_MOCKING=disabled`.
3. Ganti [`src/types/api.ts`](src/types/api.ts) dengan hasil generate dari
   Swagger backend (`openapi-typescript`) — perbedaan bentuk response akan
   langsung muncul sebagai error TypeScript.
4. Jalankan ulang `bun run test:e2e` terhadap backend asli.

Tidak ada kode aplikasi yang perlu diubah untuk peralihan ini; `src/mocks/`
dipertahankan untuk kebutuhan pengujian.
