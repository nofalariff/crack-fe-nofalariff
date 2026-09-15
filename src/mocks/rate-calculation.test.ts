import { describe, expect, it } from "vitest"

import type { Route } from "@/types/api"

import { calculateRateFor, generateTrackingNumber } from "./db"

/**
 * Menguji rumus tarif PRD §8.2. Mock adalah cerminan aturan backend, jadi
 * kasus di sini juga menjadi spesifikasi yang harus dipenuhi backend nanti.
 */

const route: Route = {
  id: "route-test",
  serviceType: "PORT_TO_PORT",
  destinationCode: "UPG",
  destinationName: "Makassar (UPG)",
  destinationRegion: "Sulawesi Selatan",
  estimatedDays: 2,
  isActive: true,
  pricePerKg: 24_000,
  minChargeableWeight: 5,
  baseFee: 15_000,
}

describe("calculateRateFor", () => {
  it("membulatkan berat ke atas ke kelipatan 1 kg", () => {
    // 6,1 kg -> 7 kg
    const result = calculateRateFor(route, 6.1)
    expect(result.chargeableWeight).toBe(7)
    expect(result.weightFee).toBe(7 * 24_000)
  })

  it("memakai berat minimum rute bila berat lebih kecil", () => {
    // 0,3 kg -> dibulatkan 1 kg -> minimum rute 5 kg
    const result = calculateRateFor(route, 0.3)
    expect(result.chargeableWeight).toBe(5)
  })

  it("berat tepat di batas minimum tidak dinaikkan lagi", () => {
    const result = calculateRateFor(route, 5)
    expect(result.chargeableWeight).toBe(5)
  })

  it("menambahkan biaya dasar ke total", () => {
    const result = calculateRateFor(route, 10)
    expect(result.weightFee).toBe(240_000)
    expect(result.baseFee).toBe(15_000)
    expect(result.total).toBe(255_000)
  })

  it("membulatkan total ke kelipatan Rp100 ke atas", () => {
    const oddRoute: Route = { ...route, pricePerKg: 24_050, baseFee: 15_025 }
    const result = calculateRateFor(oddRoute, 1)
    // 5 kg x 24.050 = 120.250 + 15.025 = 135.275 -> 135.300
    expect(result.total).toBe(135_300)
    expect(result.total % 100).toBe(0)
  })

  it("mempertahankan berat asli yang diinput untuk ditampilkan", () => {
    const result = calculateRateFor(route, 2.1)
    expect(result.inputWeight).toBe(2.1)
    expect(result.chargeableWeight).toBe(5)
  })
})

describe("generateTrackingNumber", () => {
  it("mengikuti format LGS-YYMMDD-XXXXX", () => {
    expect(generateTrackingNumber()).toMatch(
      /^LGS-\d{6}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/
    )
  })

  it("tidak memakai karakter yang ambigu saat didikte", () => {
    const random = generateTrackingNumber().split("-")[2]
    expect(random).not.toMatch(/[01IO]/)
  })

  it("tidak berurutan — 50 nomor berturut-turut harus unik", () => {
    const numbers = new Set(
      Array.from({ length: 50 }, () => generateTrackingNumber())
    )
    expect(numbers.size).toBe(50)
  })
})
