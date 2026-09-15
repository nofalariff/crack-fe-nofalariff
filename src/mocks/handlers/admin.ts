import { http } from "msw"

import { SHIPMENT_LIMITS } from "@/lib/constants/service-type"
import {
  getAllowedTransitions,
  isValidTransition,
  requiresDeliveredTo,
  requiresReason,
} from "@/lib/constants/shipment-status"
import type {
  AdminDashboardSummary,
  AdminRoute,
  AdminShipmentDetail,
  AdminShipmentSummary,
  AdminUser,
  AdminUserDetail,
  AgentListItem,
  ApprovalStatus,
  BulkStatusRequest,
  BulkStatusResult,
  PaymentQueueItem,
  RateRequest,
  RouteRequest,
  ServiceType,
  ShipmentStatus,
  UpdateStatusRequest,
  UserRole,
  UserStatus,
  WalkInShipmentRequest,
  WeightCorrectionRequest,
  WeightCorrectionResult,
} from "@/types/api"

import {
  addEvent,
  calculateRateFor,
  countActiveShipmentsForRoute,
  daysSince,
  db,
  findRoute,
  findShipmentById,
  findUserById,
  generateTrackingNumber,
  isStalled,
  recordAudit,
  type MockShipment,
  type MockUser,
} from "../db"

import { API, fail, notFound, ok, paginate, requireAdmin } from "./shared"

/**
 * Handler operasional (PRD §10 kelompok `/admin`).
 *
 * Seluruh aturan bisnis ditegakkan di sini — transisi status, alasan wajib,
 * idempotensi verifikasi, dan larangan menangguhkan akun sendiri. UI boleh
 * menyembunyikan pilihan yang tidak sah demi kenyamanan, tetapi penolakannya
 * tetap harus datang dari sini (NFR-SEC-04).
 */

// === Pembentuk bentuk respons ===

function customerOf(shipment: MockShipment): MockUser | undefined {
  return findUserById(shipment.userId)
}

function toAdminSummary(shipment: MockShipment): AdminShipmentSummary {
  const customer = customerOf(shipment)

  return {
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    serviceType: shipment.serviceType,
    destinationCode: shipment.destinationCode,
    destinationName: shipment.destinationName,
    status: shipment.status,
    paymentStatus: shipment.paymentStatus,
    recipientName: shipment.recipientName,
    recipientCity: shipment.recipientCity,
    chargeableWeight: shipment.chargeableWeight,
    totalAmount: shipment.totalAmount,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    customerId: shipment.userId,
    customerName: customer?.fullName ?? shipment.senderName,
    customerEmail: customer?.email ?? "-",
    customerRole: customer?.role ?? "CUSTOMER",
    senderPhone: shipment.senderPhone,
    recipientPhone: shipment.recipientPhone,
    totalColli: shipment.totalColli,
    daysSinceUpdate: daysSince(shipment.updatedAt),
  }
}

function toAdminDetail(shipment: MockShipment): AdminShipmentDetail {
  const customer = customerOf(shipment)

  return {
    ...shipment,
    customerId: shipment.userId,
    customerName: customer?.fullName ?? shipment.senderName,
    customerEmail: customer?.email ?? "-",
    customerRole: customer?.role ?? "CUSTOMER",
    previousStatus: shipment.previousStatus,
  }
}

function toAdminUser(user: MockUser): AdminUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    companyName: user.agentProfile?.companyName ?? null,
    approvalStatus: user.agentProfile?.approvalStatus ?? null,
    shipmentCount: db.shipments.filter((s) => s.userId === user.id).length,
  }
}

/**
 * Terapkan satu perubahan status ke kiriman.
 *
 * Mengembalikan pesan penolakan bila transisi tidak sah, agar pemanggil satuan
 * bisa membalas 422 dan pemanggil massal bisa melewatinya (PRD FR-TRACK-03).
 */
function applyStatusChange(
  shipment: MockShipment,
  next: ShipmentStatus,
  actor: MockUser,
  options: {
    location?: string
    notes?: string
    deliveredTo?: string
    reason?: string
  }
): string | null {
  if (
    !isValidTransition(
      shipment.status,
      next,
      shipment.serviceType,
      shipment.previousStatus
    )
  ) {
    const allowed = getAllowedTransitions(
      shipment.status,
      shipment.serviceType,
      shipment.previousStatus
    )
    return allowed.length
      ? `Status tidak dapat diubah ke sana. Yang diizinkan: ${allowed.join(", ")}.`
      : "Kiriman ini sudah berstatus akhir dan tidak dapat diubah lagi."
  }

  if (requiresDeliveredTo(next) && !options.deliveredTo?.trim()) {
    return "Nama penerima barang wajib diisi untuk status Diterima."
  }

  if (requiresReason(next) && !options.reason?.trim()) {
    return "Alasan wajib diisi untuk status ini."
  }

  const before = shipment.status
  const note = [options.reason, options.notes].filter(Boolean).join(" — ")

  addEvent(shipment, next, note || undefined, options.location)

  if (next === "DELIVERED") shipment.deliveredTo = options.deliveredTo ?? null
  if (next === "CANCELLED") shipment.cancelReason = options.reason ?? null

  recordAudit({
    action: "SHIPMENT_STATUS_CHANGED",
    actor,
    entityType: "shipment",
    entityId: shipment.id,
    entityLabel: shipment.trackingNumber,
    before: { status: before },
    after: { status: next },
  })

  return null
}

// === Handler ===

export const adminHandlers = [
  // --- Dashboard (FR-TRACK-04) ---

  http.get(`${API}/admin/dashboard`, ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const statusCounts = db.shipments.reduce<
      Partial<Record<ShipmentStatus, number>>
    >((acc, shipment) => {
      acc[shipment.status] = (acc[shipment.status] ?? 0) + 1
      return acc
    }, {})

    const stalled = db.shipments.filter(isStalled)

    const summary: AdminDashboardSummary = {
      pendingPaymentVerification: db.shipments.filter((s) =>
        s.payments.some((p) => p.status === "WAITING_VERIFICATION")
      ).length,
      pendingAgentApproval: db.users.filter(
        (u) => u.agentProfile?.approvalStatus === "PENDING"
      ).length,
      stalledShipments: stalled.length,
      totalShipments: db.shipments.length,
      activeShipments: db.shipments.filter(
        (s) => s.status !== "DELIVERED" && s.status !== "CANCELLED"
      ).length,
      statusCounts,
      needsAttention: [...stalled]
        .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
        .slice(0, 8)
        .map(toAdminSummary),
    }

    return ok(summary)
  }),

  // --- Daftar kiriman (FR-ADM-01) ---

  http.get(`${API}/admin/shipments`, ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const params = new URL(request.url).searchParams
    const page = Number(params.get("page") ?? 1)
    const limit = Number(params.get("limit") ?? 20)
    const search = params.get("search")?.trim().toLowerCase()

    let rows = [...db.shipments]

    const status = params.get("status")
    const serviceType = params.get("serviceType")
    const destinationCode = params.get("destinationCode")
    const paymentStatus = params.get("paymentStatus")
    const dateFrom = params.get("dateFrom")
    const dateTo = params.get("dateTo")

    if (status) rows = rows.filter((row) => row.status === status)
    if (serviceType)
      rows = rows.filter((row) => row.serviceType === serviceType)
    if (destinationCode) {
      rows = rows.filter((row) => row.destinationCode === destinationCode)
    }
    if (paymentStatus) {
      rows = rows.filter((row) => row.paymentStatus === paymentStatus)
    }
    if (dateFrom) rows = rows.filter((row) => row.createdAt >= dateFrom)
    if (dateTo) {
      rows = rows.filter((row) => row.createdAt <= `${dateTo}T23:59:59Z`)
    }

    // Pencarian bebas: resi, pengirim, penerima, atau nomor HP (FR-ADM-01)
    if (search) {
      const plain = search.replace(/-/g, "")
      rows = rows.filter((row) => {
        const customer = customerOf(row)
        return (
          row.trackingNumber.toLowerCase().replace(/-/g, "").includes(plain) ||
          row.senderName.toLowerCase().includes(search) ||
          row.recipientName.toLowerCase().includes(search) ||
          row.senderPhone.includes(search) ||
          row.recipientPhone.includes(search) ||
          (customer?.email.toLowerCase().includes(search) ?? false)
        )
      })
    }

    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const { pageRows, meta } = paginate(rows, page, limit)
    return ok(pageRows.map(toAdminSummary), meta)
  }),

  // --- Booking walk-in oleh admin (FR-BOOK-01) ---

  http.post(`${API}/admin/shipments`, async ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const body = (await request.json()) as WalkInShipmentRequest

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
    if (!route.isActive) {
      return fail("ROUTE_INACTIVE", "Rute ini sedang tidak tersedia.", 400)
    }

    // Tanpa akun tujuan, kiriman tercatat sebagai walk-in atas nama admin.
    const owner = body.onBehalfOfUserId
      ? findUserById(body.onBehalfOfUserId)
      : auth.user
    if (!owner) return notFound("Akun customer tidak ditemukan.")

    const rate = calculateRateFor(route, body.declaredWeight)
    const createdAt = new Date().toISOString()

    const shipment: MockShipment = {
      id: `shipment-${Math.random().toString(36).slice(2, 10)}`,
      userId: owner.id,
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
          notes: body.onBehalfOfUserId
            ? "Booking dibuat admin atas nama customer"
            : "Booking walk-in dibuat admin",
          createdAt,
        },
      ],
      payments: [],
    }

    db.shipments.push(shipment)

    recordAudit({
      action: "SHIPMENT_CREATED_BY_ADMIN",
      actor: auth.user,
      entityType: "shipment",
      entityId: shipment.id,
      entityLabel: shipment.trackingNumber,
      after: {
        customer: owner.fullName,
        total: shipment.totalAmount,
      },
    })

    return ok(toAdminDetail(shipment), undefined, 201)
  }),

  // --- Update status massal (FR-TRACK-03) ---

  http.post(`${API}/admin/shipments/bulk-status`, async ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const body = (await request.json()) as BulkStatusRequest
    const result: BulkStatusResult = { updatedCount: 0, skipped: [] }

    for (const id of body.shipmentIds) {
      const shipment = findShipmentById(id)
      if (!shipment) {
        result.skipped.push({
          trackingNumber: id,
          reason: "Kiriman tidak ditemukan",
        })
        continue
      }

      // Kiriman yang transisinya tidak sah dilewati, bukan menggagalkan semuanya.
      const error = applyStatusChange(shipment, body.status, auth.user, {
        notes: body.notes,
        // Status yang menuntut alasan atau nama penerima tidak bisa massal,
        // karena keduanya khas per kiriman.
      })

      if (error) {
        result.skipped.push({
          trackingNumber: shipment.trackingNumber,
          reason: error,
        })
        continue
      }

      result.updatedCount += 1
    }

    return ok(result)
  }),

  // --- Detail & pemrosesan satu kiriman ---

  http.get(`${API}/admin/shipments/:id`, ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const key = String(params.id)
    const shipment = db.shipments.find(
      (row) => row.id === key || row.trackingNumber === key
    )
    if (!shipment) return notFound("Kiriman tidak ditemukan.")

    return ok(toAdminDetail(shipment))
  }),

  http.post(
    `${API}/admin/shipments/:id/status`,
    async ({ request, params }) => {
      const auth = requireAdmin(request)
      if ("response" in auth) return auth.response

      const shipment = findShipmentById(String(params.id))
      if (!shipment) return notFound("Kiriman tidak ditemukan.")

      const body = (await request.json()) as UpdateStatusRequest
      const error = applyStatusChange(shipment, body.status, auth.user, body)

      if (error) {
        return fail("SHIPMENT_INVALID_TRANSITION", error, 422)
      }

      return ok(toAdminDetail(shipment))
    }
  ),

  // --- Koreksi berat & penyesuaian tagihan (FR-PAY-05) ---

  http.patch(
    `${API}/admin/shipments/:id/weight`,
    async ({ request, params }) => {
      const auth = requireAdmin(request)
      if ("response" in auth) return auth.response

      const shipment = findShipmentById(String(params.id))
      if (!shipment) return notFound("Kiriman tidak ditemukan.")

      const body = (await request.json()) as WeightCorrectionRequest

      if (!body.actualWeight || body.actualWeight <= 0) {
        return fail("VALIDATION_ERROR", "Berat harus lebih dari 0 kg.", 400, [
          { field: "actualWeight", message: "Berat harus lebih dari 0 kg." },
        ])
      }

      if (body.actualWeight > SHIPMENT_LIMITS.maxWeightKg) {
        return fail(
          "WEIGHT_EXCEEDS_LIMIT",
          `Berat melebihi batas ${SHIPMENT_LIMITS.maxWeightKg} kg per kiriman.`,
          400
        )
      }

      const route = findRoute(shipment.serviceType, shipment.destinationCode)
      if (!route) return fail("ROUTE_NOT_SERVED", "Rute tidak ditemukan.", 404)

      const previousChargeableWeight = shipment.chargeableWeight
      const previousTotalAmount = shipment.totalAmount

      // Tarif yang dipakai tetap snapshot milik kiriman, bukan tarif berjalan —
      // koreksi berat tidak boleh diam-diam mengubah harga per kg (PRD §8.2).
      const recalculated = calculateRateFor(
        {
          ...route,
          pricePerKg: shipment.pricePerKgSnapshot,
          baseFee: shipment.baseFeeSnapshot,
        },
        body.actualWeight
      )

      shipment.actualWeight = body.actualWeight
      shipment.chargeableWeight = recalculated.chargeableWeight
      shipment.totalAmount = recalculated.total
      shipment.updatedAt = new Date().toISOString()

      const difference = recalculated.total - previousTotalAmount

      // Kekurangan ditandai, tetapi pengiriman tetap boleh berjalan — ini
      // keputusan bisnis, bukan pemblokiran sistem (PRD FR-PAY-05).
      if (shipment.paymentStatus === "PAID") {
        shipment.outstandingAmount = Math.max(0, difference)
      } else {
        shipment.outstandingAmount = recalculated.total
      }

      recordAudit({
        action: "SHIPMENT_WEIGHT_CORRECTED",
        actor: auth.user,
        entityType: "shipment",
        entityId: shipment.id,
        entityLabel: shipment.trackingNumber,
        before: {
          chargeableWeight: previousChargeableWeight,
          totalAmount: previousTotalAmount,
        },
        after: {
          actualWeight: body.actualWeight,
          chargeableWeight: recalculated.chargeableWeight,
          totalAmount: recalculated.total,
        },
      })

      const result: WeightCorrectionResult = {
        shipment: toAdminDetail(shipment),
        previousChargeableWeight,
        previousTotalAmount,
        difference,
      }

      return ok(result)
    }
  ),

  // --- Antrean pembayaran (FR-PAY-03) ---

  http.get(`${API}/admin/payments`, ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const params = new URL(request.url).searchParams
    const status = params.get("status") ?? "WAITING_VERIFICATION"
    const page = Number(params.get("page") ?? 1)
    const limit = Number(params.get("limit") ?? 20)

    const rows: PaymentQueueItem[] = []

    for (const shipment of db.shipments) {
      const customer = customerOf(shipment)

      for (const payment of shipment.payments) {
        if (status !== "ALL" && payment.status !== status) continue

        rows.push({
          paymentId: payment.id,
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          customerName: customer?.fullName ?? shipment.senderName,
          customerEmail: customer?.email ?? "-",
          totalAmount: shipment.totalAmount,
          claimedAmount: payment.claimedAmount,
          difference: payment.claimedAmount - shipment.totalAmount,
          senderAccountName: payment.senderAccountName,
          transferDate: payment.transferDate,
          attachmentId: payment.attachmentId,
          attachmentName: payment.attachmentName,
          status: payment.status,
          submittedAt: payment.createdAt,
        })
      }
    }

    // Terlama lebih dulu — antrean kerja, bukan linimasa (FR-PAY-03).
    rows.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))

    const { pageRows, meta } = paginate(rows, page, limit)
    return ok(pageRows, meta)
  }),

  // --- Verifikasi pembayaran (FR-PAY-04) ---

  http.post(`${API}/admin/payments/:id/verify`, ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const paymentId = String(params.id)
    const shipment = db.shipments.find((row) =>
      row.payments.some((payment) => payment.id === paymentId)
    )
    if (!shipment) return notFound("Data pembayaran tidak ditemukan.")

    const payment = shipment.payments.find((item) => item.id === paymentId)!

    // Idempoten: menyetujui ulang ditolak, bukan menggandakan event.
    if (payment.status === "VERIFIED") {
      return fail(
        "PAYMENT_ALREADY_VERIFIED",
        "Pembayaran untuk kiriman ini sudah diverifikasi.",
        409
      )
    }

    payment.status = "VERIFIED"
    payment.verifiedAt = new Date().toISOString()
    payment.rejectionReason = null

    shipment.paymentStatus = "PAID"
    shipment.outstandingAmount = 0

    if (shipment.status === "PENDING_PAYMENT") {
      addEvent(shipment, "PAID", "Pembayaran terverifikasi")
    }

    recordAudit({
      action: "PAYMENT_VERIFIED",
      actor: auth.user,
      entityType: "payment",
      entityId: payment.id,
      entityLabel: shipment.trackingNumber,
      before: { status: "WAITING_VERIFICATION" },
      after: { status: "VERIFIED", amount: payment.claimedAmount },
    })

    return ok(toAdminDetail(shipment))
  }),

  http.post(`${API}/admin/payments/:id/reject`, async ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const paymentId = String(params.id)
    const shipment = db.shipments.find((row) =>
      row.payments.some((payment) => payment.id === paymentId)
    )
    if (!shipment) return notFound("Data pembayaran tidak ditemukan.")

    const payment = shipment.payments.find((item) => item.id === paymentId)!
    const body = (await request.json()) as { reason?: string }
    const reason = body.reason?.trim() ?? ""

    if (reason.length < 10) {
      return fail(
        "VALIDATION_ERROR",
        "Alasan penolakan minimal 10 karakter.",
        400,
        [{ field: "reason", message: "Alasan penolakan minimal 10 karakter." }]
      )
    }

    if (payment.status === "VERIFIED") {
      return fail(
        "PAYMENT_ALREADY_VERIFIED",
        "Pembayaran ini sudah diverifikasi dan tidak dapat ditolak.",
        409
      )
    }

    payment.status = "REJECTED"
    payment.rejectionReason = reason

    // Kiriman kembali menunggu pembayaran agar customer bisa mengunggah ulang.
    shipment.paymentStatus = "UNPAID"
    shipment.updatedAt = new Date().toISOString()

    recordAudit({
      action: "PAYMENT_REJECTED",
      actor: auth.user,
      entityType: "payment",
      entityId: payment.id,
      entityLabel: shipment.trackingNumber,
      before: { status: "WAITING_VERIFICATION" },
      after: { status: "REJECTED", reason },
    })

    return ok(toAdminDetail(shipment))
  }),

  // --- Agen (FR-AGENT-01…03) ---

  http.get(`${API}/admin/agents`, ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const params = new URL(request.url).searchParams
    const status = params.get("status") as ApprovalStatus | null
    const page = Number(params.get("page") ?? 1)
    const limit = Number(params.get("limit") ?? 20)

    const rows: AgentListItem[] = db.users
      .filter((user) => user.role === "AGENT" && user.agentProfile)
      .filter((user) => !status || user.agentProfile!.approvalStatus === status)
      .map((user) => ({
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        companyName: user.agentProfile!.companyName,
        companyAddress: user.agentProfile!.companyAddress,
        picName: user.agentProfile!.picName,
        picPhone: user.agentProfile!.picPhone,
        npwp: user.agentProfile!.npwp,
        approvalStatus: user.agentProfile!.approvalStatus,
        rejectionReason: user.agentProfile!.rejectionReason,
        submittedAt: user.createdAt,
        reviewedAt: user.agentProfile!.reviewedAt,
      }))

    // Pengajuan terlama ditinjau lebih dulu (FR-AGENT-01).
    rows.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))

    const { pageRows, meta } = paginate(rows, page, limit)
    return ok(pageRows, meta)
  }),

  http.post(`${API}/admin/agents/:id/approve`, ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const user = findUserById(String(params.id))
    if (!user?.agentProfile) return notFound("Agen tidak ditemukan.")

    if (user.agentProfile.approvalStatus === "APPROVED") {
      return fail(
        "VALIDATION_ERROR",
        "Agen ini sudah disetujui sebelumnya.",
        409
      )
    }

    const before = user.agentProfile.approvalStatus
    user.agentProfile.approvalStatus = "APPROVED"
    user.agentProfile.rejectionReason = null
    user.agentProfile.reviewedAt = new Date().toISOString()

    recordAudit({
      action: "AGENT_APPROVED",
      actor: auth.user,
      entityType: "agent",
      entityId: user.id,
      entityLabel: user.agentProfile.companyName,
      before: { approvalStatus: before },
      after: { approvalStatus: "APPROVED" },
    })

    return ok(toAdminUser(user))
  }),

  http.post(`${API}/admin/agents/:id/reject`, async ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const user = findUserById(String(params.id))
    if (!user?.agentProfile) return notFound("Agen tidak ditemukan.")

    const body = (await request.json()) as { reason?: string }
    const reason = body.reason?.trim() ?? ""

    if (reason.length < 10) {
      return fail(
        "VALIDATION_ERROR",
        "Alasan penolakan minimal 10 karakter.",
        400,
        [{ field: "reason", message: "Alasan penolakan minimal 10 karakter." }]
      )
    }

    const before = user.agentProfile.approvalStatus
    user.agentProfile.approvalStatus = "REJECTED"
    user.agentProfile.rejectionReason = reason
    user.agentProfile.reviewedAt = new Date().toISOString()

    recordAudit({
      action: "AGENT_REJECTED",
      actor: auth.user,
      entityType: "agent",
      entityId: user.id,
      entityLabel: user.agentProfile.companyName,
      before: { approvalStatus: before },
      after: { approvalStatus: "REJECTED", reason },
    })

    return ok(toAdminUser(user))
  }),

  // --- User (FR-ADM-04) ---

  http.get(`${API}/admin/users`, ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const params = new URL(request.url).searchParams
    const role = params.get("role") as UserRole | null
    const status = params.get("status") as UserStatus | null
    const search = params.get("search")?.trim().toLowerCase()
    const page = Number(params.get("page") ?? 1)
    const limit = Number(params.get("limit") ?? 20)

    let rows = db.users.filter((user) => {
      if (role && user.role !== role) return false
      if (status && user.status !== status) return false
      return true
    })

    if (search) {
      rows = rows.filter(
        (user) =>
          user.fullName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          (user.agentProfile?.companyName.toLowerCase().includes(search) ??
            false)
      )
    }

    rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const { pageRows, meta } = paginate(rows, page, limit)
    return ok(pageRows.map(toAdminUser), meta)
  }),

  http.get(`${API}/admin/users/:id`, ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const user = findUserById(String(params.id))
    if (!user) return notFound("Pengguna tidak ditemukan.")

    const shipments = db.shipments.filter((row) => row.userId === user.id)
    const statusCounts = shipments.reduce<
      Partial<Record<ShipmentStatus, number>>
    >((acc, shipment) => {
      acc[shipment.status] = (acc[shipment.status] ?? 0) + 1
      return acc
    }, {})

    const detail: AdminUserDetail = {
      ...toAdminUser(user),
      agentProfile: user.agentProfile,
      statusCounts,
      totalSpent: shipments
        .filter((row) => row.paymentStatus === "PAID")
        .reduce((sum, row) => sum + row.totalAmount, 0),
      recentShipments: [...shipments]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    }

    return ok(detail)
  }),

  http.patch(`${API}/admin/users/:id/status`, async ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const user = findUserById(String(params.id))
    if (!user) return notFound("Pengguna tidak ditemukan.")

    // Admin tidak boleh mengunci dirinya sendiri keluar (FR-ADM-04).
    if (user.id === auth.user.id) {
      return fail(
        "FORBIDDEN",
        "Anda tidak dapat mengubah status akun Anda sendiri.",
        403
      )
    }

    const body = (await request.json()) as { status?: UserStatus }
    if (body.status !== "ACTIVE" && body.status !== "SUSPENDED") {
      return fail("VALIDATION_ERROR", "Status akun tidak dikenal.", 400)
    }

    const before = user.status
    user.status = body.status

    recordAudit({
      action: "USER_STATUS_CHANGED",
      actor: auth.user,
      entityType: "user",
      entityId: user.id,
      entityLabel: user.email,
      before: { status: before },
      after: { status: body.status },
    })

    return ok(toAdminUser(user))
  }),

  // --- Rute & tarif (FR-RATE-03/04) ---

  http.get(`${API}/admin/routes`, ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const rows: AdminRoute[] = db.routes.map((route) => ({
      ...route,
      activeShipmentCount: countActiveShipmentsForRoute(route.id),
    }))

    return ok(rows)
  }),

  http.post(`${API}/admin/routes`, async ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const body = (await request.json()) as RouteRequest
    const code = body.destinationCode.trim().toUpperCase()

    // Kode tujuan unik per jenis layanan (FR-RATE-03).
    if (findRoute(body.serviceType, code)) {
      return fail(
        "VALIDATION_ERROR",
        "Kode tujuan ini sudah dipakai pada layanan yang sama.",
        400,
        [{ field: "destinationCode", message: "Kode tujuan sudah dipakai." }]
      )
    }

    const route = {
      id: `route-${code.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`,
      serviceType: body.serviceType as ServiceType,
      destinationCode: code,
      destinationName: body.destinationName.trim(),
      destinationRegion: body.destinationRegion.trim(),
      estimatedDays: body.estimatedDays,
      isActive: body.isActive ?? true,
      // Tarif diisi lewat endpoint tarif; default nol menandai belum diatur.
      pricePerKg: 0,
      minChargeableWeight: 1,
      baseFee: 0,
    }

    db.routes.push(route)

    recordAudit({
      action: "ROUTE_CREATED",
      actor: auth.user,
      entityType: "route",
      entityId: route.id,
      entityLabel: `${route.serviceType} — ${route.destinationName}`,
      after: { destinationCode: route.destinationCode },
    })

    return ok({ ...route, activeShipmentCount: 0 }, undefined, 201)
  }),

  http.patch(`${API}/admin/routes/:id`, async ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const route = db.routes.find((item) => item.id === String(params.id))
    if (!route) return notFound("Rute tidak ditemukan.")

    const body = (await request.json()) as Partial<RouteRequest>
    const before = {
      destinationName: route.destinationName,
      estimatedDays: route.estimatedDays,
      isActive: String(route.isActive),
    }

    if (body.destinationName)
      route.destinationName = body.destinationName.trim()
    if (body.destinationRegion) {
      route.destinationRegion = body.destinationRegion.trim()
    }
    if (body.estimatedDays) route.estimatedDays = body.estimatedDays
    if (body.isActive !== undefined) route.isActive = body.isActive

    recordAudit({
      action: "ROUTE_UPDATED",
      actor: auth.user,
      entityType: "route",
      entityId: route.id,
      entityLabel: route.destinationName,
      before,
      after: {
        destinationName: route.destinationName,
        estimatedDays: route.estimatedDays,
        isActive: String(route.isActive),
      },
    })

    return ok({
      ...route,
      activeShipmentCount: countActiveShipmentsForRoute(route.id),
    })
  }),

  http.put(`${API}/admin/routes/:id/rate`, async ({ request, params }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const route = db.routes.find((item) => item.id === String(params.id))
    if (!route) return notFound("Rute tidak ditemukan.")

    const body = (await request.json()) as RateRequest

    if (body.pricePerKg <= 0 || body.minChargeableWeight <= 0) {
      return fail(
        "VALIDATION_ERROR",
        "Harga per kg dan berat minimum harus lebih besar dari nol.",
        400
      )
    }

    const before = {
      pricePerKg: route.pricePerKg,
      minChargeableWeight: route.minChargeableWeight,
      baseFee: route.baseFee,
    }

    // Hanya berlaku untuk booking baru: kiriman lama memakai snapshot sendiri,
    // jadi tidak ada yang perlu dihitung ulang di sini (FR-RATE-04).
    route.pricePerKg = body.pricePerKg
    route.minChargeableWeight = body.minChargeableWeight
    route.baseFee = body.baseFee

    recordAudit({
      action: "RATE_UPDATED",
      actor: auth.user,
      entityType: "rate",
      entityId: route.id,
      entityLabel: route.destinationName,
      before,
      after: {
        pricePerKg: route.pricePerKg,
        minChargeableWeight: route.minChargeableWeight,
        baseFee: route.baseFee,
      },
    })

    return ok({
      ...route,
      activeShipmentCount: countActiveShipmentsForRoute(route.id),
    })
  }),

  // --- Audit log (FR-ADM-05) ---

  http.get(`${API}/admin/audit-logs`, ({ request }) => {
    const auth = requireAdmin(request)
    if ("response" in auth) return auth.response

    const params = new URL(request.url).searchParams
    const action = params.get("action")
    const dateFrom = params.get("dateFrom")
    const dateTo = params.get("dateTo")
    const page = Number(params.get("page") ?? 1)
    const limit = Number(params.get("limit") ?? 30)

    let rows = [...db.auditLogs]

    if (action) rows = rows.filter((row) => row.action === action)
    if (dateFrom) rows = rows.filter((row) => row.createdAt >= dateFrom)
    if (dateTo)
      rows = rows.filter((row) => row.createdAt <= `${dateTo}T23:59:59Z`)

    const { pageRows, meta } = paginate(rows, page, limit)
    return ok(pageRows, meta)
  }),
]
