import { expect, test, type Page } from "@playwright/test"

/**
 * Alur operasional admin di atas mock MSW.
 *
 * Mock bersifat stateful per proses server, sehingga pengujian yang mengubah
 * data memilih targetnya sendiri dari antrean — bukan menyandarkan diri pada
 * nomor resi tertentu yang bisa sudah diproses pengujian lain.
 */

const ADMIN = { email: "admin@logisend.id", password: "password123" }
const PENDING_AGENT = {
  email: "agenkedua@example.com",
  password: "password123",
}

async function loginAs(
  page: Page,
  user: { email: string; password: string },
  landing: string
) {
  await page.goto("/masuk")
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Masuk" }).click()
  await page.waitForURL(landing)
}

const loginAsAdmin = (page: Page) => loginAs(page, ADMIN, "**/admin")

async function logout(page: Page) {
  await page.goto("/admin")
  await page.getByRole("button", { name: /Sari/ }).click()
  await page.getByRole("menuitem", { name: "Keluar" }).click()
  await page.waitForURL("**/masuk")
}

test.describe("Verifikasi pembayaran", () => {
  test("menyetujui pembayaran mengubah status kiriman dan terlihat customer", async ({
    page,
  }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/pembayaran?status=WAITING_VERIFICATION")

    const firstResi = page.locator("a.font-mono").first()
    await expect(firstResi).toBeVisible()
    const trackingNumber = (await firstResi.textContent())?.trim() ?? ""
    expect(trackingNumber).toMatch(/^LGS-/)

    await page.getByRole("button", { name: "Setujui" }).first().click()

    // Kiriman kini berstatus Pembayaran Terverifikasi
    await page.goto(`/admin/kiriman/${trackingNumber}`)
    await expect(
      page.getByText("Pembayaran Terverifikasi").first()
    ).toBeVisible()
  })

  test("verifikasi admin langsung terlihat oleh customer pemiliknya", async ({
    page,
  }) => {
    // Kiriman seed milik kargo@example.com yang buktinya menunggu verifikasi.
    // Dipilih secara eksplisit — bukan `.first()` dari antrean — agar tidak
    // bertabrakan dengan pengujian lain yang juga memproses antrean.
    const trackingNumber = "LGS-260812-402QX"

    await loginAsAdmin(page)
    await page.goto(`/admin/kiriman/${trackingNumber}`)

    await page.getByRole("button", { name: "Setujui" }).click()
    await expect(
      page.getByText("Pembayaran Terverifikasi").first()
    ).toBeVisible()

    await logout(page)

    // Customer pemiliknya melihat perubahan itu pada kirimannya sendiri.
    await loginAs(
      page,
      { email: "kargo@example.com", password: "password123" },
      "**/dashboard"
    )
    await page.goto(`/kirim/${trackingNumber}`)

    await expect(
      page.getByText("Pembayaran Terverifikasi").first()
    ).toBeVisible()
    await expect(page.getByText("Lunas")).toBeVisible()
  })

  test("menolak pembayaran mewajibkan alasan yang memadai", async ({
    page,
  }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/pembayaran?status=WAITING_VERIFICATION")

    await page.getByRole("button", { name: "Tolak" }).first().click()

    // Alasan terlalu pendek ditolak
    await page.getByLabel("Alasan penolakan").fill("salah")
    await page.getByRole("button", { name: "Tolak Pembayaran" }).click()
    await expect(page.getByText(/minimal 10 karakter/i)).toBeVisible()

    // Alasan memadai diterima
    await page
      .getByLabel("Alasan penolakan")
      .fill("Nominal transfer tidak sesuai dengan tagihan")
    await page.getByRole("button", { name: "Tolak Pembayaran" }).click()

    await expect(
      page.getByRole("dialog", { name: "Tolak bukti pembayaran" })
    ).toHaveCount(0)
  })

  test("selisih nominal transfer ditandai", async ({ page }) => {
    await loginAsAdmin(page)

    // Kiriman seed yang nominal transfernya sengaja dibuat tidak sama dengan
    // tagihan. Dibuka lewat detail kirimannya, bukan lewat antrean, supaya
    // tidak bergantung pada apakah antrean sudah diproses pengujian lain —
    // penandaan selisih melekat pada datanya, bukan pada status antreannya.
    await page.goto("/admin/kiriman/LGS-260814-604QX")

    await expect(
      page.getByText(/Nominal transfer lebih (besar|kecil)/)
    ).toBeVisible()
  })
})

test.describe("Update status kiriman", () => {
  test("hanya menawarkan transisi yang sah dari status sekarang", async ({
    page,
  }) => {
    await loginAsAdmin(page)

    // Kiriman IN_TRANSIT hanya boleh ke Tiba di Kota Tujuan atau Tertahan
    await page.goto("/admin/kiriman?status=IN_TRANSIT")
    await page.locator("a.font-mono").first().click()
    await page.waitForURL(/\/admin\/kiriman\/LGS-/)

    await page.getByRole("button", { name: "Ubah Status" }).click()
    await page.getByLabel("Status baru").click()

    await expect(
      page.getByRole("option", { name: "Tiba di Kota Tujuan" })
    ).toBeVisible()
    await expect(page.getByRole("option", { name: "Tertahan" })).toBeVisible()

    // Melompat ke Diterima tidak ditawarkan
    await expect(
      page.getByRole("option", { name: "Diterima", exact: true })
    ).toHaveCount(0)
  })

  test("status Diterima mewajibkan nama penerima", async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto("/admin/kiriman?status=READY_FOR_PICKUP")
    await page.locator("a.font-mono").first().click()
    await page.waitForURL(/\/admin\/kiriman\/LGS-/)

    await page.getByRole("button", { name: "Ubah Status" }).click()
    await page.getByLabel("Status baru").click()
    await page.getByRole("option", { name: "Diterima", exact: true }).click()

    const deliveredTo = page.getByLabel("Diterima oleh")
    await expect(deliveredTo).toBeVisible()
    await expect(deliveredTo).toHaveAttribute("required", "")

    // Submit dengan kolom kosong tertahan — dialog tetap terbuka.
    await page.getByRole("button", { name: "Simpan Perubahan" }).click()
    await expect(
      page.getByRole("dialog", { name: "Ubah Status Kiriman" })
    ).toBeVisible()

    // Setelah diisi, perubahan tersimpan dan nama penerima tercatat.
    await deliveredTo.fill("Penerima Uji")
    await page.getByRole("button", { name: "Simpan Perubahan" }).click()

    await expect(
      page.getByRole("dialog", { name: "Ubah Status Kiriman" })
    ).toHaveCount(0)
    await expect(page.getByText("Diterima oleh Penerima Uji")).toBeVisible()
  })

  test("status Tertahan mewajibkan alasan dan tercatat di riwayat", async ({
    page,
  }) => {
    await loginAsAdmin(page)

    await page.goto("/admin/kiriman?status=RECEIVED_AT_WAREHOUSE")
    await page.locator("a.font-mono").first().click()
    await page.waitForURL(/\/admin\/kiriman\/LGS-/)

    await page.getByRole("button", { name: "Ubah Status" }).click()
    await page.getByLabel("Status baru").click()
    await page.getByRole("option", { name: "Tertahan" }).click()

    await page
      .getByLabel("Alasan")
      .fill("Dokumen surat muatan belum lengkap dari pengirim")
    await page.getByRole("button", { name: "Simpan Perubahan" }).click()

    await expect(page.getByText("Tertahan").first()).toBeVisible()
    await expect(
      page.getByText("Dokumen surat muatan belum lengkap dari pengirim")
    ).toBeVisible()
  })
})

test.describe("Aksi massal", () => {
  test("melaporkan yang berhasil dan yang dilewati", async ({ page }) => {
    await loginAsAdmin(page)

    // Campur status agar sebagian transisi tidak sah
    await page.goto("/admin/kiriman")
    await page
      .getByRole("checkbox", { name: "Pilih semua kiriman di halaman ini" })
      .check()

    await expect(page.getByText(/kiriman dipilih/)).toBeVisible()

    await page.getByLabel("Ubah status menjadi").click()
    await page.getByRole("option", { name: "Dalam Perjalanan" }).click()
    await page.getByRole("button", { name: "Terapkan" }).click()

    // Sebagian gagal tidak menggagalkan seluruh operasi
    await expect(page.getByText(/dilewati/).first()).toBeVisible()
  })
})

test.describe("Koreksi berat", () => {
  test("memperlihatkan dampak tagihan sebelum disimpan", async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto("/admin/kiriman?status=RECEIVED_AT_WAREHOUSE")
    await page.locator("a.font-mono").first().click()
    await page.waitForURL(/\/admin\/kiriman\/LGS-/)

    await page.getByRole("button", { name: "Koreksi Berat" }).click()
    await page.getByLabel("Berat hasil timbang (kg)").fill("999")

    await expect(page.getByText(/Tagihan naik/)).toBeVisible()
    await expect(page.getByText(/Perkiraan total baru/)).toBeVisible()
  })
})

test.describe("Approval agen", () => {
  test("menyetujui agen membuka kemampuan booking miliknya", async ({
    page,
  }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/agen?status=PENDING")

    await expect(page.getByText("CV Kusuma Ekspres")).toBeVisible()
    await page.getByRole("button", { name: "Setujui" }).first().click()

    await logout(page)

    // Agen yang baru disetujui langsung bisa booking, tanpa login ulang khusus
    await loginAs(page, PENDING_AGENT, "**/dashboard")
    await page.goto("/kirim")
    await expect(page).toHaveURL(/\/kirim$/)
    await expect(
      page.getByRole("heading", { name: "Kirim Barang" })
    ).toBeVisible()
  })

  test("menolak agen mewajibkan alasan", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/agen?status=PENDING")

    // Tunggu daftar benar-benar tampil sebelum mencari tombolnya.
    await expect(page.getByRole("heading", { name: "Agen" })).toBeVisible()

    const rejectButton = page.getByRole("button", { name: "Tolak" }).first()
    await expect(rejectButton).toBeVisible()
    await rejectButton.click()
    await page.getByLabel("Alasan penolakan").fill("kurang")
    await page.getByRole("button", { name: "Tolak Pengajuan" }).click()

    await expect(page.getByText(/minimal 10 karakter/i)).toBeVisible()
  })
})

test.describe("Kelola pengguna", () => {
  test("admin tidak dapat mengubah status akunnya sendiri", async ({
    page,
  }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/pengguna?search=admin@logisend.id")

    await expect(page.getByText("Akun Anda")).toBeVisible()
  })

  test("menangguhkan akun membuatnya tidak bisa masuk", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/pengguna?search=rahmat@example.com")

    await page.getByRole("button", { name: "Tangguhkan" }).first().click()
    await page.getByRole("button", { name: "Ya, tangguhkan" }).click()

    await expect(page.getByText("Ditangguhkan").first()).toBeVisible()

    await logout(page)

    await page.goto("/masuk")
    await page.getByLabel("Email").fill("rahmat@example.com")
    await page.getByLabel("Password").fill("password123")
    await page.getByRole("button", { name: "Masuk" }).click()

    await expect(page.getByText(/ditangguhkan/i)).toBeVisible()
  })
})

test.describe("Rute & tarif", () => {
  test("mengubah tarif tidak mengubah tagihan kiriman yang sudah terbit", async ({
    page,
  }) => {
    await loginAsAdmin(page)

    // Catat tagihan sebuah kiriman rute UPG sebelum tarif diubah
    await page.goto("/admin/kiriman?destinationCode=UPG")
    await page.locator("a.font-mono").first().click()
    await page.waitForURL(/\/admin\/kiriman\/LGS-/)
    const shipmentUrl = page.url()

    const totalBefore = await page
      .getByText(/^Rp[\d.]+$/)
      .first()
      .textContent()

    // Naikkan tarif rute UPG
    await page.goto("/admin/rute")
    const upgRow = page.getByRole("row", { name: /Makassar \(UPG\)/ })
    await upgRow.getByRole("button", { name: "Atur Tarif" }).click()
    await page.getByLabel("Harga per kg (Rp)").fill("99000")
    await page.getByRole("button", { name: "Simpan Tarif" }).click()

    await expect(
      page.getByRole("dialog", { name: /Tarif Makassar/ })
    ).toHaveCount(0)

    // Tagihan kiriman lama tetap sama
    await page.goto(shipmentUrl)
    const totalAfter = await page
      .getByText(/^Rp[\d.]+$/)
      .first()
      .textContent()

    expect(totalAfter).toBe(totalBefore)
  })
})

test.describe("Audit log", () => {
  test("mencatat aksi admin beserta nilai sebelum dan sesudah", async ({
    page,
  }) => {
    await loginAsAdmin(page)

    // Lakukan satu aksi yang pasti tercatat
    await page.goto("/admin/kiriman?status=PAID")
    await page.locator("a.font-mono").first().click()
    await page.waitForURL(/\/admin\/kiriman\/LGS-/)

    await page.getByRole("button", { name: "Ubah Status" }).click()
    await page.getByLabel("Status baru").click()
    await page.getByRole("option", { name: "Diterima di Gudang" }).click()
    await page.getByRole("button", { name: "Simpan Perubahan" }).click()
    await expect(page.getByText("Diterima di Gudang").first()).toBeVisible()

    await page.goto("/admin/audit-log")
    await expect(page.getByText("Status kiriman diubah").first()).toBeVisible()
    await expect(page.getByText("Sari Operasional").first()).toBeVisible()
  })
})

test.describe("Booking walk-in", () => {
  test("admin dapat membuat kiriman atas nama customer", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/kiriman/baru")

    await page.getByLabel("Tujuan").click()
    await page.getByRole("option", { name: "Palu (PLW)" }).click()
    await page.getByLabel("Berat (kg)").fill("7")

    await page.getByLabel("Nama penerima").fill("Penerima Counter")
    await page.getByLabel("Nomor HP penerima").fill("081299887766")
    await page.getByLabel("Kota / kabupaten").fill("Palu")
    await page.getByLabel("Deskripsi isi barang").fill("Sembako kemasan")
    await page.getByRole("checkbox").last().check()

    await page.getByRole("button", { name: "Buat Kiriman" }).click()

    await page.waitForURL(/\/admin\/kiriman\/LGS-[\w-]+\?dibuat=1/)
    await expect(page.getByText("Kiriman berhasil dibuat")).toBeVisible()
    await expect(page.getByText("Menunggu Pembayaran").first()).toBeVisible()
  })
})
