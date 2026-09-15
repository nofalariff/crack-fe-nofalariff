import { expect, test } from "@playwright/test"

/**
 * Alur utama dari sisi customer, dijalankan di atas mock MSW.
 *
 * Akun uji berasal dari src/mocks/db.ts. Karena mock bersifat stateful per
 * proses server, setiap pengujian yang membuat data memakai akun baru agar
 * tidak saling mengganggu.
 */

const EXISTING_CUSTOMER = {
  email: "budi@example.com",
  password: "password123",
}

const PENDING_AGENT = {
  email: "agenbaru@example.com",
  password: "password123",
}

const ADMIN = {
  email: "admin@logisend.id",
  password: "password123",
}

async function login(
  page: import("@playwright/test").Page,
  user: { email: string; password: string },
  /** Tujuan setelah login — admin mendarat di area operasional. */
  landing = "**/dashboard"
) {
  await page.goto("/masuk")
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Masuk" }).click()
  await page.waitForURL(landing)
}

test.describe("Halaman publik", () => {
  test("landing menampilkan cakupan rute dari API", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: /Kirim kargo udara/i })
    ).toBeVisible()

    // Rute datang dari API, bukan hardcode di komponen
    await expect(page.getByText("Makassar (UPG)").first()).toBeVisible()
    await expect(page.getByText("Jawa Timur").first()).toBeVisible()
  })

  test("cek ongkir menghitung sesuai aturan tarif dan menandai estimasi", async ({
    page,
  }) => {
    await page.goto("/cek-ongkir")

    await page.getByLabel("Tujuan pengiriman").click()
    await page.getByRole("option", { name: "Makassar (UPG)" }).click()
    await page.getByLabel("Berat barang (kg)").fill("2.3")
    await page.getByRole("button", { name: "Hitung Ongkir" }).click()

    // 2,3 kg dibulatkan jadi 3 kg, lalu dinaikkan ke berat minimum rute 5 kg
    await expect(page.getByText("Total estimasi")).toBeVisible()
    await expect(page.getByText("5 kg").first()).toBeVisible()
    await expect(page.getByText(/Angka ini/)).toContainText("estimasi")
  })

  test("rute yang tidak dilayani ditolak dengan pesan yang jelas", async ({
    page,
  }) => {
    await page.goto("/cek-ongkir")

    await page.getByLabel("Berat barang (kg)").fill("5")
    await page.getByRole("button", { name: "Hitung Ongkir" }).click()

    await expect(page.getByText("Pilih tujuan pengiriman")).toBeVisible()
  })

  test("berat melebihi batas ditolak", async ({ page }) => {
    await page.goto("/cek-ongkir")

    await page.getByLabel("Tujuan pengiriman").click()
    await page.getByRole("option", { name: "Makassar (UPG)" }).click()
    await page.getByLabel("Berat barang (kg)").fill("1500")
    await page.getByRole("button", { name: "Hitung Ongkir" }).click()

    await expect(page.getByText(/maksimal 1000 kg/i)).toBeVisible()
  })
})

test.describe("Guard rute", () => {
  test("dashboard tidak bisa diakses tanpa sesi", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/masuk\?next=%2Fdashboard/)
  })

  test("isian form tidak hilang saat submit gagal", async ({ page }) => {
    // React mengosongkan input tak-terkontrol setelah form action selesai.
    // Tanpa penanganan khusus, satu kesalahan validasi memaksa pengguna
    // mengetik ulang seluruh form — termasuk form registrasi.
    await page.goto("/daftar")
    await page.getByLabel("Nama lengkap").fill("Calon Pelanggan")
    await page.getByLabel("Email").fill("budi@example.com") // sudah terdaftar
    await page.getByLabel("Nomor HP").fill("081234567890")
    await page.getByLabel("Password", { exact: true }).fill("password123")
    await page.getByLabel("Ulangi password").fill("password123")
    await page.getByRole("button", { name: "Daftar" }).click()

    await expect(page.getByText(/sudah terdaftar/i)).toBeVisible()

    await expect(page.getByLabel("Nama lengkap")).toHaveValue("Calon Pelanggan")
    await expect(page.getByLabel("Nomor HP")).toHaveValue("081234567890")
  })

  test("kredensial salah memberi pesan generik", async ({ page }) => {
    await page.goto("/masuk")
    await page.getByLabel("Email").fill("budi@example.com")
    await page.getByLabel("Password").fill("passwordsalah1")
    await page.getByRole("button", { name: "Masuk" }).click()

    await expect(page.getByText("Email atau password salah.")).toBeVisible()
  })
})

test.describe("Alur booking sampai pembayaran", () => {
  test("registrasi → login → booking → invoice → unggah bukti → lihat status", async ({
    page,
  }) => {
    const email = `uji-${Date.now()}@example.com`
    const password = "password123"

    // 1. Registrasi
    await page.goto("/daftar")
    await page.getByLabel("Nama lengkap").fill("Uji Otomatis")
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Nomor HP").fill("081234567891")
    await page.getByLabel("Password", { exact: true }).fill(password)
    await page.getByLabel("Ulangi password").fill(password)
    await page.getByRole("button", { name: "Daftar" }).click()

    await page.waitForURL("**/masuk**")
    await expect(page.getByText("Pendaftaran berhasil")).toBeVisible()

    // 2. Login
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password").fill(password)
    await page.getByRole("button", { name: "Masuk" }).click()
    await page.waitForURL("**/dashboard")
    await expect(page.getByText("Belum ada kiriman")).toBeVisible()

    // 3. Booking — langkah 1
    await page.goto(
      "/kirim?serviceType=PORT_TO_PORT&destinationCode=UPG&weight=6"
    )
    await expect(page.getByText("Total estimasi")).toBeVisible()
    await page.getByRole("button", { name: "Lanjut ke Penerima" }).click()

    // Langkah 2
    await page.getByLabel("Nama penerima").fill("Hasan Basri")
    await page.getByLabel("Nomor HP penerima").fill("082233344455")
    await page.getByLabel("Kota / kabupaten").fill("Makassar")
    await page.getByRole("button", { name: "Lanjut ke Barang" }).click()

    // Langkah 3 — coba lanjut tanpa menyetujui barang terlarang
    await page
      .getByLabel("Deskripsi isi barang")
      .fill("Pakaian dan perlengkapan rumah tangga")
    await page.getByRole("button", { name: "Lanjut ke Ringkasan" }).click()
    await expect(
      page.getByText("Anda belum menyetujui pernyataan barang terlarang")
    ).toBeVisible()

    // Kembali dan setujui
    await page.getByRole("button", { name: "Kembali" }).click()
    await page
      .getByRole("checkbox", { name: /Saya menyatakan kiriman ini/ })
      .check()
    await page.getByRole("button", { name: "Lanjut ke Ringkasan" }).click()

    // Langkah 4 — submit
    await page.getByRole("button", { name: "Buat Booking" }).click()
    await page.waitForURL(/\/kirim\/LGS-\d{6}-[A-Z0-9]{5}\/invoice/)

    // 4. Invoice
    await expect(page.getByRole("heading", { name: "Invoice" })).toBeVisible()
    await expect(page.getByText("Instruksi pembayaran")).toBeVisible()

    const trackingNumber = page.url().match(/LGS-\d{6}-[A-Z0-9]{5}/)?.[0]
    expect(trackingNumber).toBeTruthy()

    // 5. Unggah bukti transfer
    await page.getByRole("link", { name: "Unggah Bukti Transfer" }).click()
    await page.waitForURL("**/bayar")

    await page.setInputFiles("#proof", {
      name: "bukti-transfer.png",
      mimeType: "image/png",
      // PNG 1x1 piksel
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      ),
    })
    await page.getByRole("button", { name: "Kirim Bukti Transfer" }).click()

    await page.waitForURL(/\/invoice\?bukti=terkirim/)
    await expect(page.getByText("Bukti transfer terkirim")).toBeVisible()
    await expect(page.getByText("Menunggu verifikasi admin")).toBeVisible()

    // 6. Kiriman muncul di daftar dengan status yang benar.
    // Daftar dirender dua kali (kartu untuk mobile, tabel untuk desktop);
    // menargetkan peran link membuat varian yang disembunyikan CSS terabaikan.
    await page.goto("/kiriman")
    await expect(
      page.getByRole("link", { name: trackingNumber! })
    ).toBeVisible()

    // 7. Detail menampilkan linimasa status
    await page.goto(`/kirim/${trackingNumber}`)
    await expect(page.getByText("Riwayat status")).toBeVisible()
    await expect(page.getByText("Status saat ini")).toBeVisible()
    await expect(page.getByText("Booking dibuat")).toBeVisible()
  })
})

test.describe("Aturan status", () => {
  test("filter tersimpan di URL dan bertahan setelah refresh", async ({
    page,
  }) => {
    await login(page, EXISTING_CUSTOMER)

    await page.goto("/kiriman?status=PENDING_PAYMENT")
    await expect(page).toHaveURL(/status=PENDING_PAYMENT/)

    await page.reload()
    await expect(page.getByText("Menunggu Pembayaran").first()).toBeVisible()
  })

  test("kiriman yang sudah berjalan tidak menampilkan tombol batalkan", async ({
    page,
  }) => {
    await login(page, EXISTING_CUSTOMER)

    // LGS-260901-K7QMR berstatus IN_TRANSIT pada data seed
    await page.goto("/kirim/LGS-260901-K7QMR")
    await expect(page.getByText("Dalam Perjalanan").first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Batalkan" })).toHaveCount(0)
  })

  test("kiriman menunggu pembayaran menampilkan tombol bayar dan batalkan", async ({
    page,
  }) => {
    await login(page, EXISTING_CUSTOMER)

    await page.goto("/kirim/LGS-260908-B4XTN")
    await expect(page.getByRole("link", { name: "Bayar" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Batalkan" })).toBeVisible()
  })

  test("kiriman milik akun lain tidak dapat dibuka", async ({ page }) => {
    await login(page, EXISTING_CUSTOMER)

    // LGS-260820-M9DHP milik akun agen, bukan akun ini
    await page.goto("/kirim/LGS-260820-M9DHP")
    await expect(page.getByText("Data tidak ditemukan")).toBeVisible()
  })
})

test.describe("Agen yang belum disetujui", () => {
  test("tidak dapat membuat booking dan diarahkan ke status pengajuan", async ({
    page,
  }) => {
    await login(page, PENDING_AGENT)

    await expect(page.getByText("Pengajuan agen sedang ditinjau")).toBeVisible()

    await page.goto("/kirim")
    await expect(page).toHaveURL(/\/status-pengajuan/)
    await expect(
      page.getByText("Sedang ditinjau", { exact: true })
    ).toBeVisible()
  })
})

test.describe("Admin", () => {
  test("login admin mendarat di area operasional, bukan dashboard customer", async ({
    page,
  }) => {
    await login(page, ADMIN, "**/admin")

    await expect(page).toHaveURL(/\/admin$/)
    await expect(
      page.getByRole("heading", { name: /Halo, Sari/ })
    ).toBeVisible()
    await expect(page.getByText("Perlu ditindaklanjuti")).toBeVisible()
  })

  test("admin yang membuka area customer dipantulkan ke area operasional", async ({
    page,
  }) => {
    await login(page, ADMIN, "**/admin")

    for (const path of ["/dashboard", "/kirim", "/kiriman", "/penerima"]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/admin$/)
    }
  })

  test("customer tidak dapat masuk ke area operasional", async ({ page }) => {
    await login(page, EXISTING_CUSTOMER)

    await page.goto("/admin")
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test("area operasional tertutup tanpa sesi", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/masuk\?next=%2Fadmin/)
  })
})
