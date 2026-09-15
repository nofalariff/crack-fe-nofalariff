import "server-only"

import { redirect } from "next/navigation"

import { getCurrentUserSafe } from "@/lib/api/endpoints"
import type { CurrentUser } from "@/types/api"

/**
 * Lapisan akses sesi untuk Server Component.
 *
 * Status approval agent selalu dibaca dari backend, tidak pernah dari klaim
 * JWT — agar agent yang baru disetujui langsung bisa booking tanpa login ulang
 * (PRD FR-AGENT-02).
 */

/** Kembalikan user yang sedang login, atau alihkan ke halaman masuk. */
export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUserSafe()

  if (!user) {
    const target = nextPath
      ? `/masuk?next=${encodeURIComponent(nextPath)}`
      : "/masuk"
    redirect(target)
  }

  return user
}

/** User yang login atau null — untuk halaman publik yang menyesuaikan header. */
export async function getOptionalUser(): Promise<CurrentUser | null> {
  return getCurrentUserSafe()
}

/** Agent yang belum disetujui tidak boleh membuat booking (FR-AGENT-02). */
export function canCreateBooking(user: CurrentUser): boolean {
  if (user.role !== "AGENT") return true
  return user.agentProfile?.approvalStatus === "APPROVED"
}

/** Agent dengan pengajuan yang belum selesai diproses. */
export function hasPendingAgentApplication(user: CurrentUser): boolean {
  return (
    user.role === "AGENT" && user.agentProfile?.approvalStatus !== "APPROVED"
  )
}
