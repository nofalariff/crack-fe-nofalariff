import type {
  AgentProfile,
  AuditAction,
  AuditLogEntry,
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

/**
 * `previousStatus` menyimpan status sebelum kiriman ditahan, karena jalur keluar
 * dari ON_HOLD hanya boleh kembali ke sana atau ke CANCELLED (PRD §8.3).
 */
type MockShipment = Shipment & {
  userId: string
  previousStatus: ShipmentStatus | null
}
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
  // --- Akun tambahan untuk mengisi panel admin dengan data yang layak dinilai.
  // Sengaja terpisah dari akun uji di atas supaya pengujian sisi customer tidak
  // ikut berubah saat data operasional ditambah atau diubah.
  {
    id: "user-cust-dewi",
    email: "dewi@example.com",
    password: "password123",
    fullName: "Dewi Lestari",
    phone: "+628556667777",
    role: "CUSTOMER",
    status: "ACTIVE",
    createdAt: daysAgo(70),
    agentProfile: null,
  },
  {
    id: "user-cust-rahmat",
    email: "rahmat@example.com",
    password: "password123",
    fullName: "Rahmat Hidayat",
    phone: "+628334445555",
    role: "CUSTOMER",
    status: "ACTIVE",
    createdAt: daysAgo(35),
    agentProfile: null,
  },
  {
    id: "user-cust-suspended",
    email: "nonaktif@example.com",
    password: "password123",
    fullName: "Joko Nugroho",
    phone: "+628778881234",
    role: "CUSTOMER",
    status: "SUSPENDED",
    createdAt: daysAgo(120),
    agentProfile: null,
  },
  {
    id: "user-agent-nusantara",
    email: "kargo@example.com",
    password: "password123",
    fullName: "Lina Wijaya",
    phone: "+628221119999",
    role: "AGENT",
    status: "ACTIVE",
    createdAt: daysAgo(100),
    agentProfile: {
      companyName: "PT Nusantara Kargo",
      companyAddress: "Jl. Gatot Subroto No. 88, Jakarta Selatan",
      picName: "Lina Wijaya",
      picPhone: "+628221119999",
      npwp: "01.123.456.7-011.000",
      approvalStatus: "APPROVED",
      rejectionReason: null,
      reviewedAt: daysAgo(98),
    },
  },
  {
    id: "user-agent-rejected",
    email: "agenditolak@example.com",
    password: "password123",
    fullName: "Eko Saputro",
    phone: "+628445556666",
    role: "AGENT",
    status: "ACTIVE",
    createdAt: daysAgo(12),
    agentProfile: {
      companyName: "UD Saputro Trans",
      companyAddress: "Jl. Melati No. 3, Bekasi",
      picName: "Eko Saputro",
      picPhone: "+628445556666",
      npwp: null,
      approvalStatus: "REJECTED",
      rejectionReason:
        "Alamat perusahaan tidak dapat diverifikasi. Mohon lampirkan data yang sesuai dengan dokumen legal usaha Anda.",
      reviewedAt: daysAgo(9),
    },
  },
  {
    id: "user-agent-baru2",
    email: "agenkedua@example.com",
    password: "password123",
    fullName: "Maya Kusuma",
    phone: "+628667778888",
    role: "AGENT",
    status: "ACTIVE",
    createdAt: daysAgo(4),
    agentProfile: {
      companyName: "CV Kusuma Ekspres",
      companyAddress: "Jl. Pahlawan No. 21, Tangerang Selatan",
      picName: "Maya Kusuma",
      picPhone: "+628667778888",
      npwp: "02.987.654.3-022.000",
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

type SeedShipment = Omit<MockShipment, "previousStatus">

/**
 * Kiriman milik akun uji customer dan agen.
 *
 * JANGAN mengubah isi fungsi ini: pengujian E2E sisi customer menyandarkan
 * asersinya pada nomor resi dan jumlah kiriman di sini. Data untuk menguji
 * panel admin ditambahkan di `seedOperationalShipments()`.
 */
function seedCustomerShipments(): SeedShipment[] {
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

/**
 * Data operasional untuk menilai panel admin: tersebar di seluruh status dan
 * rute, dengan beberapa kiriman sengaja dibuat "mandek" (tidak bergerak lebih
 * dari 3 hari) dan beberapa pembayaran menunggu verifikasi — termasuk satu
 * dengan nominal transfer yang tidak sama dengan tagihan.
 */
const OPERATIONAL_SENDERS = [
  { userId: "user-cust-dewi", name: "Dewi Lestari", phone: "+628556667777" },
  {
    userId: "user-cust-rahmat",
    name: "Rahmat Hidayat",
    phone: "+628334445555",
  },
  {
    userId: "user-agent-nusantara",
    name: "PT Nusantara Kargo",
    phone: "+628221119999",
  },
  {
    userId: "user-cust-suspended",
    name: "Joko Nugroho",
    phone: "+628778881234",
  },
]

const OPERATIONAL_RECIPIENTS = [
  { name: "Andi Saputra", city: "Makassar", phone: "+628211112222" },
  { name: "Nurul Aini", city: "Palu", phone: "+628211113333" },
  { name: "Reza Maulana", city: "Manado", phone: "+628211114444" },
  { name: "Sinta Dewi", city: "Surabaya", phone: "+628211115555" },
  { name: "Bagas Prakoso", city: "Semarang", phone: "+628211116666" },
  { name: "Putri Ayu", city: "Bandung", phone: "+628211117777" },
  { name: "Hendra Gunawan", city: "Yogyakarta", phone: "+628211118888" },
  { name: "Ratna Sari", city: "Bogor", phone: "+628211119999" },
]

const OPERATIONAL_ITEMS = [
  "Pakaian jadi",
  "Suku cadang motor",
  "Produk kecantikan",
  "Makanan kering kemasan",
  "Peralatan dapur",
  "Buku dan alat tulis",
  "Perangkat elektronik kecil",
  "Kain gulungan",
]

/**
 * Rencana kiriman operasional. `staleDays` mengatur berapa lama status terakhir
 * tidak berubah — yang di atas 3 hari akan muncul sebagai kiriman mandek di
 * dashboard admin (PRD FR-TRACK-04).
 */
const OPERATIONAL_PLAN: Array<{
  status: ShipmentStatus
  destination: string
  weight: number
  colli: number
  staleDays: number
  /** Bukti bayar menunggu verifikasi admin. */
  awaitingVerification?: boolean
  /** Nominal transfer berbeda dari tagihan, untuk menguji penandaan selisih. */
  claimedDelta?: number
  /** Status sebelum ditahan, hanya untuk kiriman ON_HOLD. */
  previousStatus?: ShipmentStatus
}> = [
  {
    status: "PENDING_PAYMENT",
    destination: "UPG",
    weight: 8,
    colli: 1,
    staleDays: 1,
  },
  {
    status: "PENDING_PAYMENT",
    destination: "JATIM",
    weight: 3,
    colli: 1,
    staleDays: 5,
  },
  {
    status: "PENDING_PAYMENT",
    destination: "PLW",
    weight: 15,
    colli: 2,
    staleDays: 1,
    awaitingVerification: true,
  },
  {
    status: "PENDING_PAYMENT",
    destination: "MDC",
    weight: 6,
    colli: 1,
    staleDays: 2,
    awaitingVerification: true,
  },
  {
    status: "PENDING_PAYMENT",
    destination: "JATENG_DIY",
    weight: 4.5,
    colli: 1,
    staleDays: 3,
    awaitingVerification: true,
    claimedDelta: -50_000,
  },
  {
    status: "PENDING_PAYMENT",
    destination: "JABODETABEK",
    weight: 2,
    colli: 1,
    staleDays: 4,
    awaitingVerification: true,
  },
  { status: "PAID", destination: "UPG", weight: 22, colli: 3, staleDays: 1 },
  { status: "PAID", destination: "JABAR", weight: 9, colli: 2, staleDays: 5 },
  { status: "PAID", destination: "MDC", weight: 11, colli: 1, staleDays: 2 },
  {
    status: "RECEIVED_AT_WAREHOUSE",
    destination: "UPG",
    weight: 30,
    colli: 4,
    staleDays: 1,
  },
  {
    status: "RECEIVED_AT_WAREHOUSE",
    destination: "PLW",
    weight: 18,
    colli: 2,
    staleDays: 2,
  },
  {
    status: "RECEIVED_AT_WAREHOUSE",
    destination: "MDC",
    weight: 25,
    colli: 3,
    staleDays: 6,
  },
  {
    status: "RECEIVED_AT_WAREHOUSE",
    destination: "JATIM",
    weight: 7,
    colli: 1,
    staleDays: 1,
  },
  {
    status: "RECEIVED_AT_WAREHOUSE",
    destination: "JATENG_DIY",
    weight: 12,
    colli: 2,
    staleDays: 1,
  },
  {
    status: "IN_TRANSIT",
    destination: "UPG",
    weight: 40,
    colli: 5,
    staleDays: 1,
  },
  {
    status: "IN_TRANSIT",
    destination: "PLW",
    weight: 16,
    colli: 2,
    staleDays: 4,
  },
  {
    status: "IN_TRANSIT",
    destination: "MDC",
    weight: 9.5,
    colli: 1,
    staleDays: 2,
  },
  {
    status: "IN_TRANSIT",
    destination: "JABAR",
    weight: 5,
    colli: 1,
    staleDays: 7,
  },
  {
    status: "ARRIVED_AT_DESTINATION",
    destination: "UPG",
    weight: 14,
    colli: 2,
    staleDays: 1,
  },
  {
    status: "ARRIVED_AT_DESTINATION",
    destination: "PLW",
    weight: 20,
    colli: 3,
    staleDays: 5,
  },
  {
    status: "ARRIVED_AT_DESTINATION",
    destination: "JATIM",
    weight: 6.5,
    colli: 1,
    staleDays: 2,
  },
  {
    status: "READY_FOR_PICKUP",
    destination: "UPG",
    weight: 13,
    colli: 2,
    staleDays: 3,
  },
  {
    status: "READY_FOR_PICKUP",
    destination: "MDC",
    weight: 17,
    colli: 2,
    staleDays: 8,
  },
  {
    status: "READY_FOR_PICKUP",
    destination: "PLW",
    weight: 10,
    colli: 1,
    staleDays: 1,
  },
  {
    status: "OUT_FOR_DELIVERY",
    destination: "JABODETABEK",
    weight: 3.5,
    colli: 1,
    staleDays: 1,
  },
  {
    status: "OUT_FOR_DELIVERY",
    destination: "JATENG_DIY",
    weight: 8,
    colli: 2,
    staleDays: 1,
  },
  {
    status: "OUT_FOR_DELIVERY",
    destination: "JATIM",
    weight: 5.5,
    colli: 1,
    staleDays: 4,
  },
  {
    status: "DELIVERED",
    destination: "UPG",
    weight: 19,
    colli: 2,
    staleDays: 12,
  },
  {
    status: "DELIVERED",
    destination: "PLW",
    weight: 8,
    colli: 1,
    staleDays: 20,
  },
  {
    status: "DELIVERED",
    destination: "MDC",
    weight: 26,
    colli: 3,
    staleDays: 15,
  },
  {
    status: "DELIVERED",
    destination: "JABODETABEK",
    weight: 4,
    colli: 1,
    staleDays: 9,
  },
  {
    status: "DELIVERED",
    destination: "JATIM",
    weight: 11,
    colli: 2,
    staleDays: 30,
  },
  {
    status: "DELIVERED",
    destination: "JABAR",
    weight: 7.5,
    colli: 1,
    staleDays: 18,
  },
  {
    status: "ON_HOLD",
    destination: "MDC",
    weight: 21,
    colli: 2,
    staleDays: 6,
    previousStatus: "IN_TRANSIT",
  },
  {
    status: "ON_HOLD",
    destination: "JATIM",
    weight: 4,
    colli: 1,
    staleDays: 2,
    previousStatus: "OUT_FOR_DELIVERY",
  },
  {
    status: "CANCELLED",
    destination: "UPG",
    weight: 6,
    colli: 1,
    staleDays: 14,
  },
  {
    status: "CANCELLED",
    destination: "JATENG_DIY",
    weight: 3,
    colli: 1,
    staleDays: 22,
  },
]

/** Jalur status yang dilalui sebuah kiriman sampai ke status akhirnya. */
const STATUS_PATH: ShipmentStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "RECEIVED_AT_WAREHOUSE",
  "IN_TRANSIT",
  "ARRIVED_AT_DESTINATION",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]

function seedOperationalShipments(): MockShipment[] {
  return OPERATIONAL_PLAN.map((plan, index) => {
    const route = ROUTES.find((r) => r.destinationCode === plan.destination)!
    const rate = calculateRateFor(route, plan.weight)
    const sender = OPERATIONAL_SENDERS[index % OPERATIONAL_SENDERS.length]
    const recipient =
      OPERATIONAL_RECIPIENTS[index % OPERATIONAL_RECIPIENTS.length]
    const description = OPERATIONAL_ITEMS[index % OPERATIONAL_ITEMS.length]

    // Riwayat dibangun mundur dari status sekarang supaya linimasanya masuk akal.
    const effectiveStatus = plan.previousStatus ?? plan.status
    const pathEnd = STATUS_PATH.indexOf(effectiveStatus)
    const path =
      pathEnd >= 0 ? STATUS_PATH.slice(0, pathEnd + 1) : ["PENDING_PAYMENT"]
    const filteredPath = path.filter((status) => {
      if (status === "READY_FOR_PICKUP")
        return route.serviceType === "PORT_TO_PORT"
      if (status === "OUT_FOR_DELIVERY")
        return route.serviceType === "PORT_TO_DOOR"
      return true
    }) as ShipmentStatus[]

    const createdDaysAgo = plan.staleDays + filteredPath.length + 2
    const timeline = filteredPath.map((status, step) => ({
      status,
      daysAgo: Math.max(
        plan.staleDays,
        createdDaysAgo -
          step *
            Math.max(1, Math.floor(createdDaysAgo / (filteredPath.length + 1)))
      ),
    }))

    // Status penutup (ON_HOLD / CANCELLED) menjadi entri terakhir.
    if (plan.status !== effectiveStatus) {
      timeline.push({ status: plan.status, daysAgo: plan.staleDays })
    }

    const isPaid = filteredPath.includes("PAID")
    const payments: Payment[] = []

    if (isPaid) {
      payments.push({
        id: `payment-op-${index}`,
        claimedAmount: rate.total,
        senderAccountName: sender.name,
        transferDate: daysAgo(createdDaysAgo),
        attachmentId: `attachment-op-${index}`,
        attachmentName: "bukti-transfer.jpg",
        status: "VERIFIED",
        rejectionReason: null,
        createdAt: daysAgo(createdDaysAgo),
        verifiedAt: daysAgo(createdDaysAgo - 1),
      })
    } else if (plan.awaitingVerification) {
      payments.push({
        id: `payment-op-${index}`,
        claimedAmount: rate.total + (plan.claimedDelta ?? 0),
        senderAccountName: sender.name,
        transferDate: daysAgo(plan.staleDays),
        attachmentId: `attachment-op-${index}`,
        attachmentName: "bukti-transfer.jpg",
        status: "WAITING_VERIFICATION",
        rejectionReason: null,
        createdAt: daysAgo(plan.staleDays),
        verifiedAt: null,
      })
    }

    const isDoor = route.serviceType === "PORT_TO_DOOR"

    return {
      id: `shipment-op-${index}`,
      userId: sender.userId,
      previousStatus: plan.previousStatus ?? null,
      trackingNumber: `LGS-2608${String(10 + index).padStart(2, "0")}-${RESI_ALPHABET[index % RESI_ALPHABET.length]}${String(index).padStart(2, "0")}QX`,
      serviceType: route.serviceType,
      destinationCode: route.destinationCode,
      destinationName: route.destinationName,
      status: plan.status,
      paymentStatus: isPaid
        ? ("PAID" as const)
        : plan.awaitingVerification
          ? ("WAITING_VERIFICATION" as const)
          : ("UNPAID" as const),
      senderName: sender.name,
      senderPhone: sender.phone,
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      recipientAddress: isDoor
        ? `Jl. Merdeka No. ${index + 1}, ${recipient.city}`
        : `Diambil di gudang kargo ${route.destinationName}`,
      recipientCity: recipient.city,
      recipientPostalCode: isDoor ? `${40000 + index}` : null,
      declaredWeight: plan.weight,
      actualWeight: isPaid ? plan.weight : null,
      chargeableWeight: rate.chargeableWeight,
      totalColli: plan.colli,
      pricePerKgSnapshot: rate.pricePerKg,
      baseFeeSnapshot: rate.baseFee,
      totalAmount: rate.total,
      outstandingAmount: isPaid ? 0 : rate.total,
      notes: null,
      cancelReason:
        plan.status === "CANCELLED"
          ? "Dibatalkan atas permintaan pengirim"
          : null,
      deliveredTo: plan.status === "DELIVERED" ? recipient.name : null,
      estimatedDays: route.estimatedDays,
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(plan.staleDays),
      items: [
        {
          id: `item-op-${index}`,
          description,
          quantity: plan.colli,
          weight: plan.weight,
          declaredValue: 500_000 * (index % 5 === 0 ? 4 : 1),
        },
      ],
      events: buildEvents(timeline),
      payments,
    }
  })
}

function seedShipments(): MockShipment[] {
  return [
    ...seedCustomerShipments().map((shipment) => ({
      ...shipment,
      previousStatus: null,
    })),
    ...seedOperationalShipments(),
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
  routes: ROUTES.map((route) => ({ ...route })),
  users: USERS.map((user) => ({ ...user })),
  shipments: seedShipments(),
  recipients: seedRecipients(),
  auditLogs: [] as AuditLogEntry[],
  bankAccount: {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "1234567890",
    accountHolder: "PT LogiSend Kargo Nusantara",
  },
}

export function resetDb() {
  db.routes = ROUTES.map((route) => ({ ...route }))
  db.shipments = seedShipments()
  db.recipients = seedRecipients()
  db.users = USERS.map((user) => ({ ...user }))
  db.auditLogs = []
}

// === Audit log (PRD FR-ADM-05, NFR-REL-02) ===

/**
 * Catat aksi sensitif yang dilakukan admin.
 *
 * Dipanggil dari setiap handler admin yang mengubah keadaan, supaya riwayatnya
 * lengkap tanpa bergantung pada kedisiplinan pemanggil di sisi UI.
 */
export function recordAudit(entry: {
  action: AuditAction
  actor: MockUser
  entityType: string
  entityId: string
  entityLabel: string
  before?: Record<string, string | number | null> | null
  after?: Record<string, string | number | null> | null
}): void {
  db.auditLogs.unshift({
    id: `audit-${Math.random().toString(36).slice(2, 10)}`,
    action: entry.action,
    actorName: entry.actor.fullName,
    actorEmail: entry.actor.email,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    before: entry.before ?? null,
    after: entry.after ?? null,
    createdAt: now(),
  })
}

// === Helper admin ===

/** Hari sejak perubahan status terakhir — dasar penanda kiriman mandek. */
export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

/** Kiriman aktif yang tidak bergerak lebih dari 3 hari (PRD FR-TRACK-04). */
export function isStalled(shipment: MockShipment): boolean {
  if (shipment.status === "DELIVERED" || shipment.status === "CANCELLED") {
    return false
  }
  return daysSince(shipment.updatedAt) > 3
}

export function findShipmentById(id: string): MockShipment | undefined {
  return db.shipments.find((shipment) => shipment.id === id)
}

export function countActiveShipmentsForRoute(routeId: string): number {
  const route = db.routes.find((item) => item.id === routeId)
  if (!route) return 0

  return db.shipments.filter(
    (shipment) =>
      shipment.destinationCode === route.destinationCode &&
      shipment.serviceType === route.serviceType &&
      shipment.status !== "DELIVERED" &&
      shipment.status !== "CANCELLED"
  ).length
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

/**
 * Catat perubahan status sebagai event baru.
 *
 * Riwayat bersifat append-only (NFR-REL-03): event lama tidak pernah diubah.
 * Saat kiriman ditahan, status sebelumnya disimpan supaya jalur keluar dari
 * ON_HOLD dapat divalidasi (PRD §8.3 aturan 4).
 */
export function addEvent(
  shipment: MockShipment,
  status: ShipmentStatus,
  notes?: string,
  location?: string
) {
  const event: ShipmentEvent = {
    id: `event-${Math.random().toString(36).slice(2, 10)}`,
    status,
    location: location ?? null,
    notes: notes ?? null,
    createdAt: now(),
  }

  if (status === "ON_HOLD") {
    shipment.previousStatus = shipment.status
  } else if (shipment.status === "ON_HOLD") {
    // Kendala selesai — penanda status sebelum tertahan tidak relevan lagi.
    shipment.previousStatus = null
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
