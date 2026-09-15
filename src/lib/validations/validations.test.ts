import { describe, expect, it } from "vitest"

import {
  changePasswordSchema,
  loginSchema,
  registerCustomerSchema,
} from "./auth"
import { calculateRateSchema, createShipmentSchema } from "./shipment"

const validBooking = {
  serviceType: "PORT_TO_PORT",
  destinationCode: "UPG",
  declaredWeight: "5",
  totalColli: "1",
  senderName: "Budi Santoso",
  senderPhone: "081234567890",
  recipientName: "Hasan Basri",
  recipientPhone: "082233344455",
  recipientAddress: "",
  recipientCity: "Makassar",
  itemDescription: "Pakaian",
  prohibitedItemsAgreed: true,
}

describe("registerCustomerSchema", () => {
  const base = {
    fullName: "Budi Santoso",
    email: "Budi@Example.com ",
    phone: "081234567890",
    password: "password123",
    confirmPassword: "password123",
  }

  it("menerima data yang valid dan menormalkan email serta nomor HP", () => {
    const result = registerCustomerSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("budi@example.com")
      expect(result.data.phone).toBe("+6281234567890")
    }
  })

  it("menolak password tanpa angka", () => {
    const result = registerCustomerSchema.safeParse({
      ...base,
      password: "passwordku",
      confirmPassword: "passwordku",
    })
    expect(result.success).toBe(false)
  })

  it("menolak password kurang dari 8 karakter", () => {
    const result = registerCustomerSchema.safeParse({
      ...base,
      password: "pass1",
      confirmPassword: "pass1",
    })
    expect(result.success).toBe(false)
  })

  it("menolak konfirmasi password yang berbeda", () => {
    const result = registerCustomerSchema.safeParse({
      ...base,
      confirmPassword: "password456",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword")
    }
  })
})

describe("loginSchema", () => {
  it("menolak email dengan format salah", () => {
    const result = loginSchema.safeParse({
      email: "bukan-email",
      password: "apa saja",
    })
    expect(result.success).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  it("menolak password baru yang sama dengan password lama", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "password123",
      newPassword: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(false)
  })
})

describe("calculateRateSchema", () => {
  it("menolak berat nol atau negatif", () => {
    expect(
      calculateRateSchema.safeParse({
        serviceType: "PORT_TO_PORT",
        destinationCode: "UPG",
        weight: "0",
      }).success
    ).toBe(false)

    expect(
      calculateRateSchema.safeParse({
        serviceType: "PORT_TO_PORT",
        destinationCode: "UPG",
        weight: "-3",
      }).success
    ).toBe(false)
  })

  it("menolak berat di atas batas satu kiriman", () => {
    const result = calculateRateSchema.safeParse({
      serviceType: "PORT_TO_PORT",
      destinationCode: "UPG",
      weight: "1001",
    })
    expect(result.success).toBe(false)
  })

  it("menerima berat tepat di batas", () => {
    const result = calculateRateSchema.safeParse({
      serviceType: "PORT_TO_PORT",
      destinationCode: "UPG",
      weight: "1000",
    })
    expect(result.success).toBe(true)
  })
})

describe("createShipmentSchema", () => {
  it("menerima Port to Port tanpa alamat lengkap", () => {
    expect(createShipmentSchema.safeParse(validBooking).success).toBe(true)
  })

  it("mewajibkan alamat lengkap untuk Port to Door", () => {
    const result = createShipmentSchema.safeParse({
      ...validBooking,
      serviceType: "PORT_TO_DOOR",
      destinationCode: "JATIM",
      recipientAddress: "Jl. Raya",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("recipientAddress")
    }
  })

  it("menerima Port to Door dengan alamat yang cukup panjang", () => {
    const result = createShipmentSchema.safeParse({
      ...validBooking,
      serviceType: "PORT_TO_DOOR",
      destinationCode: "JATIM",
      recipientAddress: "Jl. Raya Darmo No. 88, Wonokromo",
    })
    expect(result.success).toBe(true)
  })

  it("menolak booking tanpa persetujuan barang terlarang", () => {
    const result = createShipmentSchema.safeParse({
      ...validBooking,
      prohibitedItemsAgreed: false,
    })
    expect(result.success).toBe(false)
  })

  it("menolak jumlah koli di bawah satu", () => {
    const result = createShipmentSchema.safeParse({
      ...validBooking,
      totalColli: "0",
    })
    expect(result.success).toBe(false)
  })
})
