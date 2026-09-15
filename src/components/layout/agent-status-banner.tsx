import Link from "next/link"
import { Clock, XCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { CurrentUser } from "@/types/api"

/**
 * Pita status pengajuan agen.
 *
 * Agent yang belum disetujui tetap masuk ke dashboard dan melihat penjelasan —
 * bukan halaman error (PRD §11.3).
 */
export function AgentStatusBanner({ user }: { user: CurrentUser }) {
  const profile = user.agentProfile

  if (user.role !== "AGENT" || !profile) return null
  if (profile.approvalStatus === "APPROVED") return null

  if (profile.approvalStatus === "REJECTED") {
    return (
      <Alert variant="destructive">
        <XCircle aria-hidden />
        <AlertTitle>Pengajuan agen ditolak</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            {profile.rejectionReason ??
              "Data perusahaan Anda belum dapat kami setujui."}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/status-pengajuan">Lihat detail & perbaiki data</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <Clock aria-hidden />
      <AlertTitle>Pengajuan agen sedang ditinjau</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Anda belum dapat membuat booking sampai tim LogiSend menyetujui data
          perusahaan Anda. Fitur lain tetap dapat digunakan.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/status-pengajuan">Lihat status pengajuan</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
