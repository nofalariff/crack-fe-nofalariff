import { http, HttpResponse } from "msw"

import { SHIPMENT_LIMITS } from "@/lib/constants/service-type"
import type {
  CreateShipmentRequest,
  DashboardSummary,
  Invoice,
  LoginRequest,
  RegisterAgentRequest,
  RegisterCustomerRequest,
  ServiceType,
  ShipmentStatus,
} from "@/types/api"

import {
  addEvent,
  calculateRateFor,
  db,
  findRoute,
  findUserByEmail,
  findUserById,
  generateTrackingNumber,
  makePayment,
  toPublicUser,
  type MockShipment,
  type MockUser,
} from "../db"

import {
  API,
  fail,
  isBookingAllowed,
  ok,
  shipmentsOf,
  tokensFor,
  unauthorized,
  userFromRequest,
} from "./shared"

/**
 * Handler MSW yang meniru kontrak API PRD §10 — termasuk envelope, paginasi,
 * dan kode error domain §10.3. Jalur error sengaja ikut disediakan agar UI
 * untuk kegagalan benar-benar teruji, bukan hanya jalur bahagia.
 */

/** PNG 1×1 piksel — cukup untuk membuktikan jalur unduhnya bekerja. */
const PLACEHOLDER_PROOF = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

// === Handler ===

export const customerHandlers = [
  // --- Auth ---

  http.post(`${API}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as RegisterCustomerRequest

    if (findUserByEmail(body.email)) {
      return fail("VALIDATION_ERROR", "Email sudah terdaftar.", 400, [
        { field: "email", message: "Email sudah terdaftar." },
      ])
    }

    const user: MockUser = {
      id: `user-${Math.random().toString(36).slice(2, 10)}`,
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      phone: body.phone,
      role: "CUSTOMER",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      agentProfile: null,
    }
    db.users.push(user)

    // Registrasi tidak menerbitkan token (PRD FR-AUTH-01)
    return ok(toPublicUser(user), undefined, 201)
  }),

  http.post(`${API}/auth/register/agent`, async ({ request }) => {
    const body = (await request.json()) as RegisterAgentRequest

    if (findUserByEmail(body.email)) {
      return fail("VALIDATION_ERROR", "Email sudah terdaftar.", 400, [
        { field: "email", message: "Email sudah terdaftar." },
      ])
    }

    const user: MockUser = {
      id: `user-${Math.random().toString(36).slice(2, 10)}`,
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      phone: body.phone,
      role: "AGENT",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      agentProfile: {
        companyName: body.companyName,
        companyAddress: body.companyAddress,
        picName: body.picName,
        picPhone: body.picPhone,
        npwp: body.npwp ?? null,
        approvalStatus: "PENDING",
        rejectionReason: null,
        reviewedAt: null,
      },
    }
    db.users.push(user)

    return ok(toPublicUser(user), undefined, 201)
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest
    const user = findUserByEmail(body.email)

    // Pesan generik — tidak membocorkan apakah email terdaftar (FR-AUTH-03)
    if (!user || user.password !== body.password) {
      return fail("AUTH_INVALID_CREDENTIALS", "Email atau password salah.", 401)
    }

    if (user.status === "SUSPENDED") {
      return fail(
        "AUTH_ACCOUNT_SUSPENDED",
        "Akun Anda sedang ditangguhkan.",
        403
      )
    }

    return ok({ ...tokensFor(user), user: toPublicUser(user) })
  }),

  http.post(`${API}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string }
    const userId = body.refreshToken?.split(".")[1]
    const user = userId ? findUserById(userId) : undefined

    if (!user) return unauthorized()

    return ok(tokensFor(user))
  }),

  http.post(`${API}/auth/logout`, () => ok(null)),

  http.get(`${API}/auth/me`, ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    return ok(toPublicUser(user))
  }),

  http.patch(`${API}/auth/me`, async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const body = (await request.json()) as Record<string, string | undefined>

    if (body.fullName) user.fullName = body.fullName
    if (body.phone) user.phone = body.phone

    if (user.agentProfile) {
      if (body.companyName) user.agentProfile.companyName = body.companyName
      if (body.companyAddress)
        user.agentProfile.companyAddress = body.companyAddress
      if (body.picName) user.agentProfile.picName = body.picName
      if (body.picPhone) user.agentProfile.picPhone = body.picPhone
      if (body.npwp !== undefined) user.agentProfile.npwp = body.npwp || null
    }

    return ok(toPublicUser(user))
  }),

  http.post(`${API}/auth/change-password`, async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const body = (await request.json()) as {
      currentPassword: string
      newPassword: string
    }

    if (user.password !== body.currentPassword) {
      return fail("VALIDATION_ERROR", "Password lama tidak sesuai.", 400, [
        { field: "currentPassword", message: "Password lama tidak sesuai." },
      ])
    }

    user.password = body.newPassword
    return ok(null)
  }),

  // --- Rute & tarif ---

  http.get(`${API}/routes`, ({ request }) => {
    const serviceType = new URL(request.url).searchParams.get(
      "serviceType"
    ) as ServiceType | null

    const routes = db.routes.filter(
      (route) =>
        route.isActive && (!serviceType || route.serviceType === serviceType)
    )

    return ok(routes)
  }),

  http.post(`${API}/rates/calculate`, async ({ request }) => {
    const body = (await request.json()) as {
      serviceType: ServiceType
      destinationCode: string
      weight: number
    }

    if (!body.weight || body.weight <= 0) {
      return fail("VALIDATION_ERROR", "Berat harus lebih dari 0 kg.", 400, [
        { field: "weight", message: "Berat harus lebih dari 0 kg." },
      ])
    }

    if (body.weight > SHIPMENT_LIMITS.maxWeightKg) {
      return fail(
        "WEIGHT_EXCEEDS_LIMIT",
        `Berat melebihi batas ${SHIPMENT_LIMITS.maxWeightKg} kg per kiriman.`,
        400
      )
    }

    const route = findRoute(body.serviceType, body.destinationCode)
    if (!route) {
      return fail("ROUTE_NOT_SERVED", "Rute ini belum kami layani.", 404)
    }
    if (!route.isActive) {
      return fail("ROUTE_INACTIVE", "Rute ini sedang tidak tersedia.", 400)
    }

    return ok(calculateRateFor(route, body.weight))
  }),

  // --- Kiriman ---

  http.get(`${API}/shipments`, ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const params = new URL(request.url).searchParams
    const page = Number(params.get("page") ?? 1)
    const limit = Number(params.get("limit") ?? 20)
    const status = params.get("status")
    const serviceType = params.get("serviceType")
    const search = params.get("search")?.trim().toLowerCase()
    const dateFrom = params.get("dateFrom")
    const dateTo = params.get("dateTo")

    let rows = shipmentsOf(user)

    if (status) rows = rows.filter((row) => row.status === status)
    if (serviceType)
      rows = rows.filter((row) => row.serviceType === serviceType)
    if (dateFrom) rows = rows.filter((row) => row.createdAt >= dateFrom)
    if (dateTo)
      rows = rows.filter((row) => row.createdAt <= `${dateTo}T23:59:59Z`)
    if (search) {
      const normalized = search.replace(/-/g, "")
      rows = rows.filter(
        (row) =>
          row.trackingNumber
            .toLowerCase()
            .replace(/-/g, "")
            .includes(normalized) ||
          row.recipientName.toLowerCase().includes(search)
      )
    }

    rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const total = rows.length
    const start = (page - 1) * limit
    const pageRows = rows.slice(start, start + limit)

    return ok(pageRows, {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  }),

  http.get(
    `${API}/shipments/:trackingNumber/invoice`,
    ({ request, params }) => {
      const user = userFromRequest(request)
      if (!user) return unauthorized()

      const trackingNumber = String(params.trackingNumber)
      const shipment = shipmentsOf(user).find(
        (row) => row.trackingNumber === trackingNumber
      )

      // 404 (bukan 403) agar keberadaan data milik orang lain tidak terbaca
      if (!shipment) {
        return fail("NOT_FOUND", "Kiriman tidak ditemukan.", 404)
      }

      const issuedAt = shipment.createdAt
      const dueAt = new Date(
        new Date(issuedAt).getTime() +
          SHIPMENT_LIMITS.paymentDueHours * 60 * 60 * 1000
      ).toISOString()

      const invoice: Invoice = {
        trackingNumber: shipment.trackingNumber,
        issuedAt,
        dueAt,
        customerName: user.fullName,
        customerEmail: user.email,
        serviceType: shipment.serviceType,
        destinationName: shipment.destinationName,
        chargeableWeight: shipment.chargeableWeight,
        pricePerKg: shipment.pricePerKgSnapshot,
        weightFee: shipment.chargeableWeight * shipment.pricePerKgSnapshot,
        baseFee: shipment.baseFeeSnapshot,
        totalAmount: shipment.totalAmount,
        outstandingAmount: shipment.outstandingAmount,
        paymentStatus: shipment.paymentStatus,
        bankAccount: db.bankAccount,
        payments: shipment.payments,
      }

      return ok(invoice)
    }
  ),

  http.get(`${API}/shipments/:trackingNumber`, ({ request, params }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const trackingNumber = String(params.trackingNumber)
    const shipment = shipmentsOf(user).find(
      (row) => row.trackingNumber === trackingNumber
    )

    if (!shipment) return fail("NOT_FOUND", "Kiriman tidak ditemukan.", 404)

    return ok(shipment)
  }),

  http.post(`${API}/shipments`, async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    if (!isBookingAllowed(user)) {
      return fail(
        "AGENT_NOT_APPROVED",
        "Akun agen Anda masih menunggu persetujuan admin.",
        403
      )
    }

    const body = (await request.json()) as CreateShipmentRequest

    if (!body.prohibitedItemsAgreed) {
      return fail(
        "PROHIBITED_ITEMS_NOT_AGREED",
        "Pernyataan barang terlarang belum disetujui.",
        400
      )
    }

    if (body.declaredWeight > SHIPMENT_LIMITS.maxWeightKg) {
      return fail(
        "WEIGHT_EXCEEDS_LIMIT",
        `Berat melebihi batas ${SHIPMENT_LIMITS.maxWeightKg} kg per kiriman.`,
        400
      )
    }

    const route = findRoute(body.serviceType, body.destinationCode)
    if (!route)
      return fail("ROUTE_NOT_SERVED", "Rute ini belum kami layani.", 404)
    if (!route.isActive)
      return fail("ROUTE_INACTIVE", "Rute ini sedang tidak tersedia.", 400)

    // Total dihitung di server; nilai apa pun dari client diabaikan (FR-BOOK-01)
    const rate = calculateRateFor(route, body.declaredWeight)
    const createdAt = new Date().toISOString()

    const shipment: MockShipment = {
      id: `shipment-${Math.random().toString(36).slice(2, 10)}`,
      userId: user.id,
      previousStatus: null,
      trackingNumber: generateTrackingNumber(),
      serviceType: body.serviceType,
      destinationCode: route.destinationCode,
      destinationName: route.destinationName,
      status: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
      senderName: body.senderName,
      senderPhone: body.senderPhone,
      recipientName: body.recipientName,
      recipientPhone: body.recipientPhone,
      recipientAddress: body.recipientAddress,
      recipientCity: body.recipientCity,
      recipientPostalCode: body.recipientPostalCode ?? null,
      declaredWeight: body.declaredWeight,
      actualWeight: null,
      chargeableWeight: rate.chargeableWeight,
      totalColli: body.totalColli,
      pricePerKgSnapshot: rate.pricePerKg,
      baseFeeSnapshot: rate.baseFee,
      totalAmount: rate.total,
      outstandingAmount: rate.total,
      notes: body.notes ?? null,
      cancelReason: null,
      deliveredTo: null,
      estimatedDays: route.estimatedDays,
      createdAt,
      updatedAt: createdAt,
      items: [
        {
          id: `item-${Math.random().toString(36).slice(2, 10)}`,
          description: body.itemDescription,
          quantity: body.totalColli,
          weight: body.declaredWeight,
          declaredValue: body.declaredValue ?? null,
        },
      ],
      events: [
        {
          id: `event-${Math.random().toString(36).slice(2, 10)}`,
          status: "PENDING_PAYMENT",
          location: null,
          notes: "Booking dibuat",
          createdAt,
        },
      ],
      payments: [],
    }

    db.shipments.push(shipment)

    if (body.saveRecipient) {
      db.recipients.push({
        id: `recipient-${Math.random().toString(36).slice(2, 10)}`,
        userId: user.id,
        label: null,
        name: body.recipientName,
        phone: body.recipientPhone,
        address: body.recipientAddress,
        city: body.recipientCity,
        postalCode: body.recipientPostalCode ?? null,
        createdAt,
      })
    }

    return ok(shipment, undefined, 201)
  }),

  http.patch(`${API}/shipments/:id`, async ({ request, params }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const shipment = shipmentsOf(user).find(
      (row) => row.id === String(params.id)
    )
    if (!shipment) return fail("NOT_FOUND", "Kiriman tidak ditemukan.", 404)

    const editable: ShipmentStatus[] = ["PENDING_PAYMENT", "PAID"]
    if (!editable.includes(shipment.status)) {
      return fail(
        "SHIPMENT_NOT_EDITABLE",
        "Kiriman ini sudah tidak dapat diubah.",
        409
      )
    }

    const body = (await request.json()) as Record<string, string | undefined>

    if (body.recipientName) shipment.recipientName = body.recipientName
    if (body.recipientPhone) shipment.recipientPhone = body.recipientPhone
    if (body.recipientAddress) shipment.recipientAddress = body.recipientAddress
    if (body.recipientCity) shipment.recipientCity = body.recipientCity
    if (body.recipientPostalCode !== undefined)
      shipment.recipientPostalCode = body.recipientPostalCode || null
    if (body.itemDescription && shipment.items[0])
      shipment.items[0].description = body.itemDescription
    if (body.notes !== undefined) shipment.notes = body.notes || null

    shipment.updatedAt = new Date().toISOString()

    return ok(shipment)
  }),

  http.post(`${API}/shipments/:id/cancel`, async ({ request, params }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const shipment = shipmentsOf(user).find(
      (row) => row.id === String(params.id)
    )
    if (!shipment) return fail("NOT_FOUND", "Kiriman tidak ditemukan.", 404)

    // Customer/agent hanya boleh membatalkan saat menunggu pembayaran (§8.5)
    if (shipment.status !== "PENDING_PAYMENT") {
      return fail(
        "SHIPMENT_NOT_CANCELLABLE",
        "Kiriman ini sudah tidak dapat dibatalkan.",
        409
      )
    }

    const body = (await request.json().catch(() => ({}))) as { reason?: string }

    shipment.cancelReason = body.reason ?? "Dibatalkan oleh pemesan"
    addEvent(shipment, "CANCELLED", shipment.cancelReason)

    return ok(shipment)
  }),

  // --- Pembayaran ---

  http.post(`${API}/shipments/:id/payments`, async ({ request, params }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const shipment = shipmentsOf(user).find(
      (row) => row.id === String(params.id)
    )
    if (!shipment) return fail("NOT_FOUND", "Kiriman tidak ditemukan.", 404)

    if (shipment.paymentStatus === "PAID") {
      return fail(
        "PAYMENT_ALREADY_VERIFIED",
        "Pembayaran untuk kiriman ini sudah diverifikasi.",
        409
      )
    }

    if (shipment.status === "CANCELLED") {
      return fail("SHIPMENT_NOT_EDITABLE", "Kiriman ini sudah dibatalkan.", 409)
    }

    const formData = await request.formData()
    const file = formData.get("proof")

    if (!(file instanceof File)) {
      return fail("VALIDATION_ERROR", "Bukti transfer wajib diunggah.", 400, [
        { field: "proof", message: "Bukti transfer wajib diunggah." },
      ])
    }

    if (file.size > SHIPMENT_LIMITS.maxUploadBytes) {
      return fail("FILE_TOO_LARGE", "Ukuran berkas melebihi 5 MB.", 400)
    }

    if (!SHIPMENT_LIMITS.acceptedUploadTypes.includes(file.type)) {
      return fail(
        "FILE_TYPE_NOT_ALLOWED",
        "Format berkas tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.",
        400
      )
    }

    const payment = makePayment(
      Number(formData.get("claimedAmount") ?? shipment.totalAmount),
      String(formData.get("senderAccountName") ?? user.fullName),
      String(formData.get("transferDate") ?? new Date().toISOString()),
      file.name
    )

    shipment.payments = [payment, ...shipment.payments]
    shipment.paymentStatus = "WAITING_VERIFICATION"
    shipment.updatedAt = new Date().toISOString()

    return ok(shipment, undefined, 201)
  }),

  // --- Buku alamat ---

  http.get(`${API}/recipients`, ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    return ok(db.recipients.filter((row) => row.userId === user.id))
  }),

  http.post(`${API}/recipients`, async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const body = (await request.json()) as Record<string, string | undefined>
    const recipient = {
      id: `recipient-${Math.random().toString(36).slice(2, 10)}`,
      userId: user.id,
      label: body.label || null,
      name: String(body.name),
      phone: String(body.phone),
      address: String(body.address),
      city: String(body.city),
      postalCode: body.postalCode || null,
      createdAt: new Date().toISOString(),
    }

    db.recipients.push(recipient)
    return ok(recipient, undefined, 201)
  }),

  http.patch(`${API}/recipients/:id`, async ({ request, params }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const recipient = db.recipients.find(
      (row) => row.id === String(params.id) && row.userId === user.id
    )
    if (!recipient) return fail("NOT_FOUND", "Penerima tidak ditemukan.", 404)

    const body = (await request.json()) as Record<string, string | undefined>

    if (body.label !== undefined) recipient.label = body.label || null
    if (body.name) recipient.name = body.name
    if (body.phone) recipient.phone = body.phone
    if (body.address) recipient.address = body.address
    if (body.city) recipient.city = body.city
    if (body.postalCode !== undefined)
      recipient.postalCode = body.postalCode || null

    return ok(recipient)
  }),

  http.delete(`${API}/recipients/:id`, ({ request, params }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const index = db.recipients.findIndex(
      (row) => row.id === String(params.id) && row.userId === user.id
    )
    if (index === -1) return fail("NOT_FOUND", "Penerima tidak ditemukan.", 404)

    db.recipients.splice(index, 1)
    return ok(null)
  }),

  // --- Dashboard ---

  http.get(`${API}/dashboard/summary`, ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const rows = shipmentsOf(user)
    const statusCounts = rows.reduce<Partial<Record<ShipmentStatus, number>>>(
      (acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1
        return acc
      },
      {}
    )

    const summary: DashboardSummary = {
      statusCounts,
      totalShipments: rows.length,
      awaitingPaymentCount: rows.filter(
        (row) => row.status === "PENDING_PAYMENT"
      ).length,
      inProgressCount: rows.filter(
        (row) =>
          !["PENDING_PAYMENT", "DELIVERED", "CANCELLED"].includes(row.status)
      ).length,
      deliveredCount: rows.filter((row) => row.status === "DELIVERED").length,
      recentShipments: [...rows]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    }

    return ok(summary)
  }),

  // --- Berkas bukti pembayaran ---

  /**
   * Bukti transfer hanya boleh diambil pemiliknya atau admin (NFR-SEC-07).
   * Mock mengembalikan gambar placeholder; yang diuji di sini adalah
   * penjagaan aksesnya, bukan isi berkasnya.
   */
  http.get(`${API}/files/:id`, ({ request, params }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()

    const attachmentId = String(params.id)
    const owner = db.shipments.find((shipment) =>
      shipment.payments.some((payment) => payment.attachmentId === attachmentId)
    )

    if (!owner) {
      return fail("NOT_FOUND", "Berkas tidak ditemukan.", 404)
    }

    if (user.role !== "ADMIN" && owner.userId !== user.id) {
      return fail("FORBIDDEN", "Anda tidak memiliki akses ke berkas ini.", 403)
    }

    return HttpResponse.arrayBuffer(PLACEHOLDER_PROOF.buffer as ArrayBuffer, {
      headers: { "Content-Type": "image/png" },
    })
  }),
]
