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
  "dashboard" | "kirim" | "kiriman" | "penerima" | "profil"

export type NavItem = {
  href: string
  label: string
  icon: NavIconKey
  /** Dikunci untuk agent yang belum disetujui. */
  disabled?: boolean
}

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/kirim", label: "Kirim Barang", icon: "kirim" },
  { href: "/kiriman", label: "Kiriman Saya", icon: "kiriman" },
  { href: "/penerima", label: "Penerima", icon: "penerima" },
  { href: "/profil", label: "Profil", icon: "profil" },
]
