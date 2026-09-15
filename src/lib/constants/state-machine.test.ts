import { describe, expect, it } from "vitest"

import type { ServiceType, ShipmentStatus } from "@/types/api"

import {
  SHIPMENT_STATUS_META,
  STATUS_TRANSITIONS,
  getAllowedTransitions,
  isValidTransition,
  requiresDeliveredTo,
  requiresReason,
} from "./shipment-status"

/**
 * State machine status kiriman (PRD §8.3).
 *
 * Peta ini dipakai dua arah — UI menawarkan pilihan, backend menegakkan — jadi
 * kasus di sini sekaligus menjadi spesifikasi yang harus dipenuhi backend.
 */

const ALL_STATUSES = Object.keys(SHIPMENT_STATUS_META) as ShipmentStatus[]
const PORT: ServiceType = "PORT_TO_PORT"
const DOOR: ServiceType = "PORT_TO_DOOR"

describe("alur normal", () => {
  it("menerima jalur Port to Port sampai selesai", () => {
    const path: ShipmentStatus[] = [
      "PENDING_PAYMENT",
      "PAID",
      "RECEIVED_AT_WAREHOUSE",
      "IN_TRANSIT",
      "ARRIVED_AT_DESTINATION",
      "READY_FOR_PICKUP",
      "DELIVERED",
    ]

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(
        isValidTransition(path[i], path[i + 1], PORT),
        `${path[i]} → ${path[i + 1]}`
      ).toBe(true)
    }
  })

  it("menerima jalur Port to Door sampai selesai", () => {
    const path: ShipmentStatus[] = [
      "PENDING_PAYMENT",
      "PAID",
      "RECEIVED_AT_WAREHOUSE",
      "IN_TRANSIT",
      "ARRIVED_AT_DESTINATION",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(
        isValidTransition(path[i], path[i + 1], DOOR),
        `${path[i]} → ${path[i + 1]}`
      ).toBe(true)
    }
  })
})

describe("transisi yang tidak sah", () => {
  it("menolak lompatan melewati tahap", () => {
    expect(isValidTransition("PENDING_PAYMENT", "IN_TRANSIT", PORT)).toBe(false)
    expect(isValidTransition("PAID", "DELIVERED", PORT)).toBe(false)
    expect(
      isValidTransition("RECEIVED_AT_WAREHOUSE", "ARRIVED_AT_DESTINATION", PORT)
    ).toBe(false)
  })

  it("menolak mundur ke status sebelumnya", () => {
    expect(isValidTransition("IN_TRANSIT", "PAID", PORT)).toBe(false)
    expect(
      isValidTransition("ARRIVED_AT_DESTINATION", "IN_TRANSIT", PORT)
    ).toBe(false)
  })

  it("menolak pembatalan setelah barang diterbangkan", () => {
    // Setelah IN_TRANSIT pembatalan tidak lagi lewat sistem (PRD §8.5)
    expect(isValidTransition("IN_TRANSIT", "CANCELLED", PORT)).toBe(false)
    expect(isValidTransition("ARRIVED_AT_DESTINATION", "CANCELLED", PORT)).toBe(
      false
    )

    expect(isValidTransition("PENDING_PAYMENT", "CANCELLED", PORT)).toBe(true)
    expect(isValidTransition("PAID", "CANCELLED", PORT)).toBe(true)
    expect(isValidTransition("RECEIVED_AT_WAREHOUSE", "CANCELLED", PORT)).toBe(
      true
    )
  })
})

describe("percabangan menurut jenis layanan", () => {
  it("Port to Port hanya boleh ke Siap Diambil", () => {
    const allowed = getAllowedTransitions("ARRIVED_AT_DESTINATION", PORT)
    expect(allowed).toContain("READY_FOR_PICKUP")
    expect(allowed).not.toContain("OUT_FOR_DELIVERY")
  })

  it("Port to Door hanya boleh ke Sedang Diantar", () => {
    const allowed = getAllowedTransitions("ARRIVED_AT_DESTINATION", DOOR)
    expect(allowed).toContain("OUT_FOR_DELIVERY")
    expect(allowed).not.toContain("READY_FOR_PICKUP")
  })

  it("menolak status akhir yang tidak sesuai layanannya", () => {
    expect(
      isValidTransition("ARRIVED_AT_DESTINATION", "OUT_FOR_DELIVERY", PORT)
    ).toBe(false)
    expect(
      isValidTransition("ARRIVED_AT_DESTINATION", "READY_FOR_PICKUP", DOOR)
    ).toBe(false)
  })
})

describe("jalur keluar dari Tertahan", () => {
  it("hanya boleh kembali ke status sebelum tertahan", () => {
    const allowed = getAllowedTransitions("ON_HOLD", PORT, "IN_TRANSIT")

    expect(allowed).toEqual(["IN_TRANSIT", "CANCELLED"])
    expect(allowed).not.toContain("DELIVERED")
    expect(allowed).not.toContain("RECEIVED_AT_WAREHOUSE")
  })

  it("mengikuti status sebelumnya yang berbeda", () => {
    expect(getAllowedTransitions("ON_HOLD", DOOR, "OUT_FOR_DELIVERY")).toEqual([
      "OUT_FOR_DELIVERY",
      "CANCELLED",
    ])
  })

  it("tetap boleh dibatalkan meski status sebelumnya tidak tercatat", () => {
    expect(getAllowedTransitions("ON_HOLD", PORT, null)).toEqual(["CANCELLED"])
  })

  it("menolak kembali ke status selain status sebelum tertahan", () => {
    expect(isValidTransition("ON_HOLD", "DELIVERED", PORT, "IN_TRANSIT")).toBe(
      false
    )
  })
})

describe("status akhir", () => {
  it("Diterima dan Dibatalkan tidak punya transisi keluar", () => {
    expect(STATUS_TRANSITIONS.DELIVERED).toEqual([])
    expect(STATUS_TRANSITIONS.CANCELLED).toEqual([])
    expect(getAllowedTransitions("DELIVERED", PORT)).toEqual([])
    expect(getAllowedTransitions("CANCELLED", PORT)).toEqual([])
  })

  it("tidak ada status yang bisa menuju kembali dari status akhir", () => {
    for (const status of ALL_STATUSES) {
      expect(isValidTransition("DELIVERED", status, PORT)).toBe(false)
      expect(isValidTransition("CANCELLED", status, PORT)).toBe(false)
    }
  })
})

describe("keterangan wajib", () => {
  it("Tertahan dan Dibatalkan menuntut alasan", () => {
    expect(requiresReason("ON_HOLD")).toBe(true)
    expect(requiresReason("CANCELLED")).toBe(true)
  })

  it("status lain tidak menuntut alasan", () => {
    const others = ALL_STATUSES.filter(
      (status) => status !== "ON_HOLD" && status !== "CANCELLED"
    )
    for (const status of others) {
      expect(requiresReason(status), status).toBe(false)
    }
  })

  it("hanya Diterima yang menuntut nama penerima", () => {
    expect(requiresDeliveredTo("DELIVERED")).toBe(true)

    for (const status of ALL_STATUSES.filter((s) => s !== "DELIVERED")) {
      expect(requiresDeliveredTo(status), status).toBe(false)
    }
  })
})

describe("keutuhan peta transisi", () => {
  it("setiap status punya entri di peta transisi", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_TRANSITIONS[status], status).toBeDefined()
    }
  })

  it("seluruh tujuan transisi adalah status yang dikenal", () => {
    for (const targets of Object.values(STATUS_TRANSITIONS)) {
      for (const target of targets) {
        expect(ALL_STATUSES).toContain(target)
      }
    }
  })

  it("tidak ada status yang menunjuk ke dirinya sendiri", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_TRANSITIONS[status], status).not.toContain(status)
    }
  })
})
