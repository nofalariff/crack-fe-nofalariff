/**
 * Tipe kontrak API LogiSend — cerminan PRD §9.2 (enum), §10 (kontrak REST),
 * dan §10.3 (kode error domain).
 *
 * Berkas ini ditulis tangan selama backend belum tersedia. Saat backend siap,
 * ganti isinya dengan hasil generate dari Swagger (`openapi-typescript`) sesuai
 * NFR-MNT-05 — perbedaan bentuk response akan langsung muncul sebagai error
 * TypeScript.
 */

// === Enum (PRD §9.2) ===

export type UserRole = "CUSTOMER" | "AGENT" | "ADMIN"
export type UserStatus = "ACTIVE" | "SUSPENDED"
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"
export type ServiceType = "PORT_TO_PORT" | "PORT_TO_DOOR"

export type ShipmentStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "RECEIVED_AT_WAREHOUSE"
  | "IN_TRANSIT"
  | "ARRIVED_AT_DESTINATION"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "ON_HOLD"
  | "CANCELLED"

/** Status pembayaran pada entitas kiriman. */
export type ShipmentPaymentStatus = "UNPAID" | "WAITING_VERIFICATION" | "PAID"

/** Status satu record bukti pembayaran. */
export type PaymentRecordStatus =
  "WAITING_VERIFICATION" | "VERIFIED" | "REJECTED"

// === Envelope (PRD §10.1) ===

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ApiSuccess<T> = {
  success: true
  data: T
  meta?: PaginationMeta
}

export type ApiFailure = {
  success: false
  error: {
    code: ApiErrorCode | string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

// === Kode error domain (PRD §10.3) ===

export type ApiErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_ACCOUNT_SUSPENDED"
  | "AGENT_NOT_APPROVED"
  | "ROUTE_NOT_SERVED"
  | "ROUTE_INACTIVE"
  | "WEIGHT_EXCEEDS_LIMIT"
  | "SHIPMENT_INVALID_TRANSITION"
  | "SHIPMENT_NOT_CANCELLABLE"
  | "SHIPMENT_NOT_EDITABLE"
  | "PAYMENT_ALREADY_VERIFIED"
  | "FILE_TYPE_NOT_ALLOWED"
  | "FILE_TOO_LARGE"
  | "PROHIBITED_ITEMS_NOT_AGREED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_ERROR"

// === Auth ===

export type AgentProfile = {
  companyName: string
  companyAddress: string
  picName: string
  picPhone: string
  npwp: string | null
  approvalStatus: ApprovalStatus
  rejectionReason: string | null
  reviewedAt: string | null
}

export type CurrentUser = {
  id: string
  email: string
  fullName: string
  phone: string
  role: UserRole
  status: UserStatus
  createdAt: string
  agentProfile: AgentProfile | null
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = AuthTokens & {
  user: CurrentUser
}

export type RegisterCustomerRequest = {
  fullName: string
  email: string
  phone: string
  password: string
}

export type RegisterAgentRequest = RegisterCustomerRequest & {
  companyName: string
  companyAddress: string
  picName: string
  picPhone: string
  npwp?: string
}

export type UpdateProfileRequest = {
  fullName?: string
  phone?: string
  companyName?: string
  companyAddress?: string
  picName?: string
  picPhone?: string
  npwp?: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

// === Rute & tarif ===

export type Route = {
  id: string
  serviceType: ServiceType
  destinationCode: string
  destinationName: string
  destinationRegion: string
  estimatedDays: number
  isActive: boolean
  pricePerKg: number
  minChargeableWeight: number
  baseFee: number
}

export type CalculateRateRequest = {
  serviceType: ServiceType
  destinationCode: string
  weight: number
}

export type RateCalculation = {
  serviceType: ServiceType
  destinationCode: string
  destinationName: string
  estimatedDays: number
  inputWeight: number
  chargeableWeight: number
  pricePerKg: number
  weightFee: number
  baseFee: number
  total: number
}

// === Penerima (buku alamat) ===

export type Recipient = {
  id: string
  label: string | null
  name: string
  phone: string
  address: string
  city: string
  postalCode: string | null
  createdAt: string
}

export type RecipientRequest = {
  label?: string
  name: string
  phone: string
  address: string
  city: string
  postalCode?: string
}

// === Kiriman ===

export type ShipmentItem = {
  id: string
  description: string
  quantity: number
  weight: number
  declaredValue: number | null
}

export type ShipmentEvent = {
  id: string
  status: ShipmentStatus
  location: string | null
  notes: string | null
  createdAt: string
}

export type ShipmentSummary = {
  id: string
  trackingNumber: string
  serviceType: ServiceType
  destinationCode: string
  destinationName: string
  status: ShipmentStatus
  paymentStatus: ShipmentPaymentStatus
  recipientName: string
  recipientCity: string
  chargeableWeight: number
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export type Shipment = ShipmentSummary & {
  senderName: string
  senderPhone: string
  recipientPhone: string
  recipientAddress: string
  recipientPostalCode: string | null
  declaredWeight: number
  actualWeight: number | null
  totalColli: number
  pricePerKgSnapshot: number
  baseFeeSnapshot: number
  outstandingAmount: number
  notes: string | null
  cancelReason: string | null
  deliveredTo: string | null
  estimatedDays: number
  items: ShipmentItem[]
  events: ShipmentEvent[]
  payments: Payment[]
}

export type CreateShipmentRequest = {
  serviceType: ServiceType
  destinationCode: string
  senderName: string
  senderPhone: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientCity: string
  recipientPostalCode?: string
  itemDescription: string
  declaredWeight: number
  totalColli: number
  declaredValue?: number
  notes?: string
  prohibitedItemsAgreed: boolean
  saveRecipient?: boolean
}

export type UpdateShipmentRequest = {
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  recipientCity?: string
  recipientPostalCode?: string
  itemDescription?: string
  notes?: string
}

export type ShipmentListParams = {
  page?: number
  limit?: number
  status?: ShipmentStatus
  serviceType?: ServiceType
  dateFrom?: string
  dateTo?: string
  search?: string
}

// === Pembayaran ===

export type Payment = {
  id: string
  claimedAmount: number
  senderAccountName: string
  transferDate: string
  attachmentId: string
  attachmentName: string
  status: PaymentRecordStatus
  rejectionReason: string | null
  createdAt: string
  verifiedAt: string | null
}

export type BankAccount = {
  bankName: string
  accountNumber: string
  accountHolder: string
}

export type Invoice = {
  trackingNumber: string
  issuedAt: string
  dueAt: string
  customerName: string
  customerEmail: string
  serviceType: ServiceType
  destinationName: string
  chargeableWeight: number
  pricePerKg: number
  weightFee: number
  baseFee: number
  totalAmount: number
  outstandingAmount: number
  paymentStatus: ShipmentPaymentStatus
  bankAccount: BankAccount
  payments: Payment[]
}

// === Dashboard ===

export type DashboardSummary = {
  statusCounts: Partial<Record<ShipmentStatus, number>>
  totalShipments: number
  awaitingPaymentCount: number
  inProgressCount: number
  deliveredCount: number
  recentShipments: ShipmentSummary[]
}
