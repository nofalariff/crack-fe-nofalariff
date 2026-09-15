import type {
  AgentProfile,
  Payment,
  Recipient,
  Route,
  ServiceType,
  Shipment,
  ShipmentEvent,
  ShipmentStatus,
  UserRole,
} from "@/types/api"

/**
 * Basis data tiruan untuk pengembangan tanpa backend.
 *
 * Bersifat stateful selama proses server hidup: booking yang dibuat benar-benar
 * muncul di daftar kiriman dan unggahan bukti benar-benar mengubah status, agar
 * alur terasa nyata saat demo maupun saat pengujian E2E.
 *
 * Seluruh aturan bisnis di sini menyalin PRD §8 — bukan mengarang aturan baru.
 */

export type MockUser = {
  id: string
  email: string
  password: string
  fullName: string
  phone: string
  role: UserRole
  status: "ACTIVE" | "SUSPENDED"
  createdAt: string
  agentProfile: AgentProfile | null
}

type MockShipment = Shipment & { userId: string }
type MockRecipient = Recipient & { userId: string }

const now = () => new Date().toISOString()
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

// === Rute & tarif (PRD §5.2) ===

const ROUTES: Route[] = [
  {
    id: "route-plw",
    serviceType: "PORT_TO_PORT",
    destinationCode: "PLW",
    destinationName: "Palu (PLW)",
    destinationRegion: "Sulawesi Tengah",
    estimatedDays: 3,
    isActive: true,
    pricePerKg: 28_000,
    minChargeableWeight: 5,
    baseFee: 15_000,
  },
  {
    id: "route-upg",
    serviceType: "PORT_TO_PORT",
    destinationCode: "UPG",
    destinationName: "Makassar (UPG)",
    destinationRegion: "Sulawesi Selatan",
    estimatedDays: 2,
    isActive: true,
    pricePerKg: 24_000,
    minChargeableWeight: 5,
    baseFee: 15_000,
  },
  {
    id: "route-mdc",
    serviceType: "PORT_TO_PORT",
    destinationCode: "MDC",
    destinationName: "Manado (MDC)",
    destinationRegion: "Sulawesi Utara",
    estimatedDays: 3,
    isActive: true,
    pricePerKg: 31_000,
    minChargeableWeight: 5,
    baseFee: 15_000,
  },
  {
    id: "route-jabodetabek",
    serviceType: "PORT_TO_DOOR",
    destinationCode: "JABODETABEK",
    destinationName: "Jabodetabek",
    destinationRegion: "Jakarta, Bogor, Depok, Tangerang, Bekasi",
    estimatedDays: 1,
    isActive: true,
    pricePerKg: 9_000,
    minChargeableWeight: 3,
    baseFee: 10_000,
  },
  {
    id: "route-jabar",
    serviceType: "PORT_TO_DOOR",
    destinationCode: "JABAR",
    destinationName: "Jawa Barat",
    destinationRegion: "Jawa Barat di luar Jabodetabek",
    estimatedDays: 2,
    isActive: true,
    pricePerKg: 12_000,
    minChargeableWeight: 3,
    baseFee: 10_000,
  },
  {
    id: "route-banten",
    serviceType: "PORT_TO_DOOR",
    destinationCode: "BANTEN",
    destinationName: "Banten",
    destinationRegion: "Banten di luar Tangerang",
    estimatedDays: 2,
    isActive: true,
    pricePerKg: 12_000,
    minChargeableWeight: 3,
    baseFee: 10_000,
  },
  {
    id: "route-jateng",
    serviceType: "PORT_TO_DOOR",
    destinationCode: "JATENG_DIY",
    destinationName: "Jawa Tengah & DI Yogyakarta",
    destinationRegion: "Jawa Tengah, DI Yogyakarta",
    estimatedDays: 2,
    isActive: true,
    pricePerKg: 14_000,
    minChargeableWeight: 3,
    baseFee: 10_000,
  },
  {
    id: "route-jatim",
    serviceType: "PORT_TO_DOOR",
    destinationCode: "JATIM",
    destinationName: "Jawa Timur",
    destinationRegion: "Jawa Timur",
    estimatedDays: 3,
    isActive: true,
    pricePerKg: 16_000,
    minChargeableWeight: 3,
    baseFee: 10_000,
  },
]

// === Akun uji ===

const USERS: MockUser[] = [
  {
    id: "user-customer",
    email: "budi@example.com",
    password: "password123",
    fullName: "Budi Santoso",
    phone: "+628123456789",
    role: "CUSTOMER",
    status: "ACTIVE",
    createdAt: daysAgo(40),
    agentProfile: null,
  },
  {
    id: "user-agent-approved",
    email: "agen@example.com",
    password: "password123",
    fullName: "Siti Rahayu",
    phone: "+628987654321",
    role: "AGENT",
    status: "ACTIVE",
    createdAt: daysAgo(60),
    agentProfile: {
      companyName: "CV Rahayu Logistik",
      companyAddress: "Jl. Mangga Besar No. 12, Jakarta Barat",
      picName: "Siti Rahayu",
      picPhone: "+628987654321",
      npwp: "09.254.294.1-407.000",
      approvalStatus: "APPROVED",
      rejectionReason: null,
      reviewedAt: daysAgo(58),
    },
  },
  {
    id: "user-agent-pending",
    email: "agenbaru@example.com",
    password: "password123",
    fullName: "Andi Pratama",
    phone: "+628111222333",
    role: "AGENT",
    status: "ACTIVE",
    createdAt: daysAgo(2),
    agentProfile: {
      companyName: "Toko Pratama Jaya",
      companyAddress: "Jl. Kebon Jeruk No. 5, Jakarta Barat",
      picName: "Andi Pratama",
      picPhone: "+628111222333",
      npwp: null,
      approvalStatus: "PENDING",
      rejectionReason: null,
      reviewedAt: null,
    },
  },
  {
    // Akun admin dibuat lewat seed, bukan registrasi publik (PRD §4.2).
    // Tidak punya agentProfile karena bukan mitra B2B.
    id: "user-admin",
    email: "admin@logisend.id",
    password: "password123",
    fullName: "Sari Operasional",
    phone: "+628555000111",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: daysAgo(90),
    agentProfile: null,
  },
]

// === Perhitungan tarif (PRD §8.2) ===

export function calculateRateFor(route: Route, weight: number) {
  const roundedWeight = Math.ceil(weight)
  const chargeableWeight = Math.max(roundedWeight, route.minChargeableWeight)
  const weightFee = chargeableWeight * route.pricePerKg
  const rawTotal = weightFee + route.baseFee
  // Pembulatan total ke kelipatan Rp100 ke atas (PRD §8.2)
  const total = Math.ceil(rawTotal / 100) * 100

  return {
    serviceType: route.serviceType,
    destinationCode: route.destinationCode,
    destinationName: route.destinationName,
    estimatedDays: route.estimatedDays,
    inputWeight: weight,
    chargeableWeight,
    pricePerKg: route.pricePerKg,
    weightFee,
    baseFee: route.baseFee,
    total,
  }
}

// === Nomor resi (PRD §8.1) ===

const RESI_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

export function generateTrackingNumber(): string {
  const d = new Date()
  const yymmdd = [
    String(d.getFullYear()).slice(2),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("")

  let random = ""
  for (let i = 0; i < 5; i += 1) {
    random += RESI_ALPHABET[Math.floor(Math.random() * RESI_ALPHABET.length)]
  }

  return `LGS-${yymmdd}-${random}`
}

// === Kiriman contoh ===

function buildEvents(
  statuses: { status: ShipmentStatus; daysAgo: number; notes?: string }[]
): ShipmentEvent[] {
  return statuses
    .map((entry, index) => ({
      id: `event-${index}-${entry.status}`,
      status: entry.status,
      location:
        entry.status === "IN_TRANSIT"
          ? "Bandara Soekarno-Hatta (CGK)"
          : entry.status === "ARRIVED_AT_DESTINATION"
            ? "Bandara tujuan"
            : null,
      notes: entry.notes ?? null,
      createdAt: daysAgo(entry.daysAgo),
    }))
    .reverse()
}

function seedShipments(): MockShipment[] {
  const upg = ROUTES.find((r) => r.destinationCode === "UPG")!
  const jatim = ROUTES.find((r) => r.destinationCode === "JATIM")!
  const mdc = ROUTES.find((r) => r.destinationCode === "MDC")!

  const first = calculateRateFor(upg, 12)
  const second = calculateRateFor(jatim, 4)
  const third = calculateRateFor(mdc, 7.5)

  return [
    {
      id: "shipment-1",
      userId: "user-customer",
      trackingNumber: "LGS-260901-K7QMR",
      serviceType: "PORT_TO_PORT",
      destinationCode: upg.destinationCode,
      destinationName: upg.destinationName,
      status: "IN_TRANSIT",
      paymentStatus: "PAID",
      senderName: "Budi Santoso",
      senderPhone: "+628123456789",
      recipientName: "Hasan Basri",
      recipientPhone: "+628223334444",
      recipientAddress: "Diambil di gudang kargo Bandara Sultan Hasanuddin",
      recipientCity: "Makassar",
      recipientPostalCode: null,
      declaredWeight: 12,
      actualWeight: 12.4,
      chargeableWeight: first.chargeableWeight,
      totalColli: 2,
      pricePerKgSnapshot: first.pricePerKg,
      baseFeeSnapshot: first.baseFee,
      totalAmount: first.total,
      outstandingAmount: 0,
      notes: null,
      cancelReason: null,
      deliveredTo: null,
      estimatedDays: upg.estimatedDays,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
      items: [
        {
          id: "item-1",
          description: "Pakaian dan perlengkapan rumah tangga",
          quantity: 2,
          weight: 12,
          declaredValue: 1_500_000,
        },
      ],
      events: buildEvents([
        { status: "PENDING_PAYMENT", daysAgo: 4 },
        { status: "PAID", daysAgo: 4, notes: "Pembayaran terverifikasi" },
        {
          status: "RECEIVED_AT_WAREHOUSE",
          daysAgo: 2,
          notes: "Berat timbang ulang 12,4 kg",
        },
        { status: "IN_TRANSIT", daysAgo: 1 },
      ]),
      payments: [
        {
          id: "payment-1",
          claimedAmount: first.total,
          senderAccountName: "Budi Santoso",
          transferDate: daysAgo(4),
          attachmentId: "attachment-1",
          attachmentName: "bukti-transfer.jpg",
          status: "VERIFIED",
          rejectionReason: null,
          createdAt: daysAgo(4),
          verifiedAt: daysAgo(4),
        },
      ],
    },
    {
      id: "shipment-2",
      userId: "user-customer",
      trackingNumber: "LGS-260908-B4XTN",
      serviceType: "PORT_TO_DOOR",
      destinationCode: jatim.destinationCode,
      destinationName: jatim.destinationName,
      status: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
      senderName: "Budi Santoso",
      senderPhone: "+628123456789",
      recipientName: "Dewi Lestari",
      recipientPhone: "+628556667777",
      recipientAddress: "Jl. Raya Darmo No. 88, Wonokromo",
      recipientCity: "Surabaya",
      recipientPostalCode: "60241",
      declaredWeight: 4,
      actualWeight: null,
      chargeableWeight: second.chargeableWeight,
      totalColli: 1,
      pricePerKgSnapshot: second.pricePerKg,
      baseFeeSnapshot: second.baseFee,
      totalAmount: second.total,
      outstandingAmount: second.total,
      notes: "Mohon dibungkus kayu",
      cancelReason: null,
      deliveredTo: null,
      estimatedDays: jatim.estimatedDays,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
      items: [
        {
          id: "item-2",
          description: "Alat elektronik rumah tangga",
          quantity: 1,
          weight: 4,
          declaredValue: 2_000_000,
        },
      ],
      events: buildEvents([{ status: "PENDING_PAYMENT", daysAgo: 1 }]),
      payments: [],
    },
    {
      id: "shipment-3",
      userId: "user-agent-approved",
      trackingNumber: "LGS-260820-M9DHP",
      serviceType: "PORT_TO_PORT",
      destinationCode: mdc.destinationCode,
      destinationName: mdc.destinationName,
      status: "DELIVERED",
      paymentStatus: "PAID",
      senderName: "CV Rahayu Logistik",
      senderPhone: "+628987654321",
      recipientName: "Grace Wenas",
      recipientPhone: "+628778889999",
      recipientAddress: "Diambil di gudang kargo Bandara Sam Ratulangi",
      recipientCity: "Manado",
      recipientPostalCode: null,
      declaredWeight: 7.5,
      actualWeight: 7.5,
      chargeableWeight: third.chargeableWeight,
      totalColli: 3,
      pricePerKgSnapshot: third.pricePerKg,
      baseFeeSnapshot: third.baseFee,
      totalAmount: third.total,
      outstandingAmount: 0,
      notes: null,
      cancelReason: null,
      deliveredTo: "Grace Wenas",
      estimatedDays: mdc.estimatedDays,
      createdAt: daysAgo(26),
      updatedAt: daysAgo(21),
      items: [
        {
          id: "item-3",
          description: "Produk kosmetik",
          quantity: 3,
          weight: 7.5,
          declaredValue: 3_200_000,
        },
      ],
      events: buildEvents([
        { status: "PENDING_PAYMENT", daysAgo: 26 },
        { status: "PAID", daysAgo: 26 },
        { status: "RECEIVED_AT_WAREHOUSE", daysAgo: 25 },
        { status: "IN_TRANSIT", daysAgo: 24 },
        { status: "ARRIVED_AT_DESTINATION", daysAgo: 22 },
        { status: "READY_FOR_PICKUP", daysAgo: 22 },
        { status: "DELIVERED", daysAgo: 21, notes: "Diambil oleh Grace Wenas" },
      ]),
      payments: [
        {
          id: "payment-3",
          claimedAmount: third.total,
          senderAccountName: "CV Rahayu Logistik",
          transferDate: daysAgo(26),
          attachmentId: "attachment-3",
          attachmentName: "transfer-agustus.pdf",
          status: "VERIFIED",
          rejectionReason: null,
          createdAt: daysAgo(26),
          verifiedAt: daysAgo(26),
        },
      ],
    },
  ]
}

function seedRecipients(): MockRecipient[] {
  return [
    {
      id: "recipient-1",
      userId: "user-customer",
      label: "Rumah Ibu",
      name: "Hasan Basri",
      phone: "+628223334444",
      address: "Jl. Perintis Kemerdekaan KM 10 No. 21",
      city: "Makassar",
      postalCode: "90245",
      createdAt: daysAgo(30),
    },
    {
      id: "recipient-2",
      userId: "user-agent-approved",
      label: "Pelanggan Manado",
      name: "Grace Wenas",
      phone: "+628778889999",
      address: "Jl. Sam Ratulangi No. 45",
      city: "Manado",
      postalCode: "95111",
      createdAt: daysAgo(50),
    },
  ]
}

// === State ===

export const db = {
  routes: ROUTES,
  users: USERS,
  shipments: seedShipments(),
  recipients: seedRecipients(),
  bankAccount: {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "1234567890",
    accountHolder: "PT LogiSend Kargo Nusantara",
  },
}

export function resetDb() {
  db.shipments = seedShipments()
  db.recipients = seedRecipients()
  db.users = USERS.map((user) => ({ ...user }))
}

// === Helper ===

export function findRoute(
  serviceType: ServiceType,
  destinationCode: string
): Route | undefined {
  return db.routes.find(
    (route) =>
      route.serviceType === serviceType &&
      route.destinationCode === destinationCode
  )
}

export function findUserById(id: string): MockUser | undefined {
  return db.users.find((user) => user.id === id)
}

export function findUserByEmail(email: string): MockUser | undefined {
  return db.users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  )
}

export function toPublicUser(user: MockUser) {
  const { password: _password, ...rest } = user
  return rest
}

export function addEvent(
  shipment: MockShipment,
  status: ShipmentStatus,
  notes?: string
) {
  const event: ShipmentEvent = {
    id: `event-${Math.random().toString(36).slice(2, 10)}`,
    status,
    location: null,
    notes: notes ?? null,
    createdAt: now(),
  }
  shipment.events = [event, ...shipment.events]
  shipment.status = status
  shipment.updatedAt = event.createdAt
}

export function nextPaymentId(): string {
  return `payment-${Math.random().toString(36).slice(2, 10)}`
}

export function makePayment(
  claimedAmount: number,
  senderAccountName: string,
  transferDate: string,
  attachmentName: string
): Payment {
  return {
    id: nextPaymentId(),
    claimedAmount,
    senderAccountName,
    transferDate,
    attachmentId: `attachment-${Math.random().toString(36).slice(2, 10)}`,
    attachmentName,
    status: "WAITING_VERIFICATION",
    rejectionReason: null,
    createdAt: now(),
    verifiedAt: null,
  }
}

export type { MockShipment, MockRecipient }
