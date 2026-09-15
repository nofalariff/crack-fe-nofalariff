import { expect, test, type Page } from "@playwright/test"

/**
 * Pemeriksaan tampilan panel admin — hanya membaca, tidak mengubah data.
 *
 * Dijalankan di viewport desktop maupun mobile. Pengujian yang mengubah data
 * ada di `admin-flow.spec.ts` dan sengaja hanya berjalan sekali (lihat
 * `playwright.config.ts`), karena mock berbagi satu state per proses server.
 */

const ADMIN = { email: "admin@logisend.id", password: "password123" }

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

test.describe("Dashboard operasional", () => {
  test("menampilkan antrean kerja dan sebaran status", async ({ page }) => {
    await loginAsAdmin(page)

    await expect(
      page.getByRole("heading", { name: /Halo, Sari/ })
    ).toBeVisible()

    await expect(page.getByText("Pembayaran menunggu verifikasi")).toBeVisible()
    await expect(page.getByText("Pengajuan agen menunggu")).toBeVisible()
    await expect(page.getByText("Kiriman mandek")).toBeVisible()

    // Sebaran status membawa label, bukan hanya warna
    await expect(page.getByText("Sebaran status")).toBeVisible()
    await expect(
      page.getByRole("link", { name: /Dalam Perjalanan/ }).first()
    ).toBeVisible()
  })

  test("badge antrean tampil di navigasi", async ({ page }) => {
    await loginAsAdmin(page)

    const paymentsLink = page
      .getByRole("navigation", { name: "Navigasi admin" })
      .first()
      .getByRole("link", { name: /Pembayaran/ })

    await expect(paymentsLink).toContainText(/\d/)
  })
})

test.describe("Daftar kiriman", () => {
  test("filter status tersimpan di URL dan menyaring hasil", async ({
    page,
  }) => {
    await loginAsAdmin(page)

    await page.goto("/admin/kiriman?status=IN_TRANSIT")
    await expect(page).toHaveURL(/status=IN_TRANSIT/)

    const badges = page.getByText("Dalam Perjalanan")
    await expect(badges.first()).toBeVisible()

    // Tidak ada status lain yang lolos filter
    await expect(page.getByText("Diterima di Gudang")).toHaveCount(0)
  })

  test("pencarian bebas menemukan kiriman lewat nama penerima", async ({
    page,
  }) => {
    await loginAsAdmin(page)

    await page.goto("/admin/kiriman")
    await page.getByLabel("Cari").fill("Hasan Basri")
    await page.getByRole("button", { name: "Cari" }).click()

    await expect(page).toHaveURL(/search=/)
    await expect(page.getByText("Hasan Basri").first()).toBeVisible()
  })
})
