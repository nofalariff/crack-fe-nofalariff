import { adminHandlers } from "./admin"
import { customerHandlers } from "./customer"

/**
 * Urutan penting: MSW memakai handler pertama yang cocok. Handler admin
 * didaftarkan lebih dulu agar `/admin/shipments` tidak tertangkap pola
 * `/shipments/:trackingNumber` milik sisi customer.
 */
export const handlers = [...adminHandlers, ...customerHandlers]
