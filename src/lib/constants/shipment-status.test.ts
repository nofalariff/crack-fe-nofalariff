import { describe, expect, it } from "vitest"

import type { ShipmentStatus } from "@/types/api"

import {
  SHIPMENT_STATUS_META,
  SHIPMENT_STATUS_ORDER,
  canCustomerCancel,
  canCustomerEdit,
  getStatusMeta,
  needsPayment,
} from "./shipment-status"

const ALL_STATUSES = Object.keys(SHIPMENT_STATUS_META) as ShipmentStatus[]

describe("peta status kiriman", () => {
  it("mencakup seluruh 10 status PRD §8.3", () => {
    expect(ALL_STATUSES).toHaveLength(10)
    expect(SHIPMENT_STATUS_ORDER).toHaveLength(10)
  })

  it("setiap status punya label bahasa Indonesia, ikon, dan deskripsi", () => {
    for (const status of ALL_STATUSES) {
      const meta = getStatusMeta(status)
      expect(meta.label.length).toBeGreaterThan(0)
      // Label tidak boleh berupa kode enum (NFR-UX-02)
      expect(meta.label).not.toBe(status)
      expect(meta.description.length).toBeGreaterThan(0)
      expect(meta.icon).toBeTruthy()
    }
  })

  it("label antar status tidak ada yang kembar", () => {
    const labels = ALL_STATUSES.map((status) => getStatusMeta(status).label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it("ikon status yang setone tetap berbeda agar tidak bergantung warna", () => {
    // NFR-UX-03: warna boleh berulang, tapi ikon+label harus membedakan.
    const icons = ALL_STATUSES.map((status) => getStatusMeta(status).icon)
    expect(new Set(icons).size).toBe(icons.length)
  })

  it("hanya DELIVERED dan CANCELLED yang final", () => {
    const finals = ALL_STATUSES.filter(
      (status) => getStatusMeta(status).isFinal
    )
    expect(finals.sort()).toEqual(["CANCELLED", "DELIVERED"])
  })
})

describe("aturan aksi customer (PRD §8.5)", () => {
  it("pembatalan mandiri hanya saat menunggu pembayaran", () => {
    expect(canCustomerCancel("PENDING_PAYMENT")).toBe(true)

    const notCancellable: ShipmentStatus[] = [
      "PAID",
      "RECEIVED_AT_WAREHOUSE",
      "IN_TRANSIT",
      "ARRIVED_AT_DESTINATION",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "ON_HOLD",
      "CANCELLED",
    ]
    for (const status of notCancellable) {
      expect(canCustomerCancel(status)).toBe(false)
    }
  })

  it("perubahan data hanya sebelum barang diterima di gudang", () => {
    expect(canCustomerEdit("PENDING_PAYMENT")).toBe(true)
    expect(canCustomerEdit("PAID")).toBe(true)
    expect(canCustomerEdit("RECEIVED_AT_WAREHOUSE")).toBe(false)
    expect(canCustomerEdit("IN_TRANSIT")).toBe(false)
    expect(canCustomerEdit("DELIVERED")).toBe(false)
  })

  it("hanya status menunggu pembayaran yang memunculkan tombol bayar", () => {
    expect(needsPayment("PENDING_PAYMENT")).toBe(true)
    expect(needsPayment("PAID")).toBe(false)
    expect(needsPayment("CANCELLED")).toBe(false)
  })
})
