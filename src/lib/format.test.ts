import { describe, expect, it } from "vitest"

import {
  formatDateTimeWIB,
  formatPhone,
  formatRupiah,
  formatWeight,
  normalizePhone,
  normalizeTrackingNumber,
} from "./format"

describe("formatRupiah", () => {
  it("memformat nominal tanpa desimal dan tanpa spasi", () => {
    expect(formatRupiah(1_250_000)).toBe("Rp1.250.000")
    expect(formatRupiah(0)).toBe("Rp0")
    expect(formatRupiah(100)).toBe("Rp100")
  })

  it("menerima string angka", () => {
    expect(formatRupiah("345000")).toBe("Rp345.000")
  })

  it("tidak menghasilkan NaN untuk input tidak valid", () => {
    expect(formatRupiah("bukan angka")).toBe("Rp0")
  })
})

describe("formatDateTimeWIB", () => {
  it("menerjemahkan waktu UTC ke WIB", () => {
    // 07:30 UTC = 14:30 WIB (UTC+7)
    expect(formatDateTimeWIB("2026-09-15T07:30:00Z")).toBe(
      "15 Sep 2026, 14:30 WIB"
    )
  })

  it("menangani pergantian hari akibat pergeseran zona", () => {
    // 20:00 UTC 15 Sep = 03:00 WIB 16 Sep
    expect(formatDateTimeWIB("2026-09-15T20:00:00Z")).toBe(
      "16 Sep 2026, 03:00 WIB"
    )
  })
})

describe("normalizePhone", () => {
  it("menormalkan berbagai penulisan nomor Indonesia ke +62", () => {
    expect(normalizePhone("081234567890")).toBe("+6281234567890")
    expect(normalizePhone("+6281234567890")).toBe("+6281234567890")
    expect(normalizePhone("6281234567890")).toBe("+6281234567890")
    expect(normalizePhone("0812-3456-7890")).toBe("+6281234567890")
    expect(normalizePhone("0812 3456 7890")).toBe("+6281234567890")
  })

  it("menolak nomor yang tidak valid", () => {
    expect(normalizePhone("12345")).toBeNull()
    expect(normalizePhone("08abc123456")).toBeNull()
    expect(normalizePhone("081")).toBeNull()
  })
})

describe("formatPhone", () => {
  it("menampilkan nomor dalam kelompok yang mudah dibaca", () => {
    expect(formatPhone("081234567890")).toBe("+62 812-3456-7890")
  })

  it("mengembalikan input apa adanya bila tidak bisa dinormalkan", () => {
    expect(formatPhone("12345")).toBe("12345")
  })
})

describe("formatWeight", () => {
  it("memakai koma sebagai pemisah desimal", () => {
    expect(formatWeight(2.5)).toBe("2,5 kg")
    expect(formatWeight(12)).toBe("12 kg")
  })
})

describe("normalizeTrackingNumber", () => {
  it("mengabaikan huruf besar-kecil dan tanda hubung", () => {
    expect(normalizeTrackingNumber("lgs-260901-k7qmr")).toBe("LGS260901K7QMR")
    expect(normalizeTrackingNumber(" LGS260901K7QMR ")).toBe("LGS260901K7QMR")
  })
})
