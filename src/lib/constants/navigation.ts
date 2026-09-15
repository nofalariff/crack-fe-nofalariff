/**
 * Data navigasi dashboard.
 *
 * Sengaja berada di modul netral (tanpa "use client"): layout adalah Server
 * Component, dan nilai yang diekspor dari modul klien tidak sampai ke server
 * sebagai data biasa. Ikon disimpan sebagai kunci teks — komponen ikon bukan
 * nilai yang bisa diserialkan lintas batas server→klien, jadi pemetaannya
 * dilakukan di sisi klien.
 */
export type NavIconKey =
  | "dashboard"
  | "kirim"
  | "kiriman"
  | "penerima"
  | "profil"
  | "pembayaran"
  | "agen"
  | "pengguna"
  | "rute"
  | "audit"

export type NavItem = {
  href: string
  label: string
  icon: NavIconKey
  /** Dikunci untuk agent yang belum disetujui. */
  disabled?: boolean
  /**
   * Nama penghitung antrean yang ditampilkan sebagai badge di menu.
   * Angkanya datang dari ringkasan dashboard, bukan disimpan di sini.
   */
  badge?: "payments" | "agents"
}

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/kirim", label: "Kirim Barang", icon: "kirim" },
  { href: "/kiriman", label: "Kiriman Saya", icon: "kiriman" },
  { href: "/penerima", label: "Penerima", icon: "penerima" },
  { href: "/profil", label: "Profil", icon: "profil" },
]

/** Navigasi area operasional. Urutan mengikuti alur kerja harian admin. */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/kiriman", label: "Kiriman", icon: "kiriman" },
  {
    href: "/admin/pembayaran",
    label: "Pembayaran",
    icon: "pembayaran",
    badge: "payments",
  },
  { href: "/admin/agen", label: "Agen", icon: "agen", badge: "agents" },
  { href: "/admin/pengguna", label: "Pengguna", icon: "pengguna" },
  { href: "/admin/rute", label: "Rute & Tarif", icon: "rute" },
  { href: "/admin/audit-log", label: "Audit Log", icon: "audit" },
]
