"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Clock, X, XCircle } from "lucide-react"
import { toast } from "sonner"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  approveAgentAction,
  rejectAgentAction,
  type AdminActionState,
} from "@/lib/actions/admin"
import { formatDateTimeWIB, formatPhone } from "@/lib/format"
import type { AgentListItem } from "@/types/api"

/** Kartu peninjauan satu pengajuan agen (FR-AGENT-01…03). */
export function AgentReview({ agent }: { agent: AgentListItem }) {
  const router = useRouter()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectState, setRejectState] = useState<AdminActionState>()

  const isPending = agent.approvalStatus === "PENDING"

  async function handleApprove(formData: FormData) {
    const result = await approveAgentAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Agen disetujui.")
      router.refresh()
      return
    }

    toast.error(result?.message ?? "Gagal menyetujui agen.")
  }

  async function handleReject(formData: FormData) {
    const result = await rejectAgentAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Pengajuan ditolak.")
      setRejectState(undefined)
      setRejectOpen(false)
      router.refresh()
      return
    }

    setRejectState(result)
  }

  const details: [string, string][] = [
    ["Alamat perusahaan", agent.companyAddress],
    ["PIC", `${agent.picName} · ${formatPhone(agent.picPhone)}`],
    ["NPWP", agent.npwp ?? "Tidak diisi"],
    ["Email akun", agent.email],
    ["Nomor HP akun", formatPhone(agent.phone)],
    ["Diajukan", formatDateTimeWIB(agent.submittedAt)],
  ]

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium">{agent.companyName}</p>
            <p className="text-muted-foreground text-sm">{agent.fullName}</p>
          </div>

          <StatusChip status={agent.approvalStatus} />
        </div>

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="break-words">{value}</dd>
            </div>
          ))}
        </dl>

        {agent.approvalStatus === "REJECTED" && agent.rejectionReason && (
          <p className="border-danger/30 bg-danger-soft text-danger-foreground rounded-lg border px-3 py-2 text-sm">
            Alasan penolakan: {agent.rejectionReason}
          </p>
        )}

        {agent.approvalStatus === "APPROVED" && agent.reviewedAt && (
          <p className="text-muted-foreground text-sm">
            Disetujui pada {formatDateTimeWIB(agent.reviewedAt)}.
          </p>
        )}

        {isPending && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <form action={handleApprove}>
              <input type="hidden" name="userId" value={agent.userId} />
              <SubmitButton pendingText="Menyetujui…">
                <Check aria-hidden />
                Setujui
              </SubmitButton>
            </form>

            <Dialog
              open={rejectOpen}
              onOpenChange={(next) => {
                setRejectOpen(next)
                if (!next) setRejectState(undefined)
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <X aria-hidden />
                  Tolak
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <form action={handleReject} className="space-y-5">
                  <input type="hidden" name="userId" value={agent.userId} />

                  <DialogHeader>
                    <DialogTitle>Tolak pengajuan agen</DialogTitle>
                    <DialogDescription>
                      Alasan ini ditampilkan kepada {agent.fullName} agar mereka
                      tahu data apa yang perlu diperbaiki sebelum mengajukan
                      ulang.
                    </DialogDescription>
                  </DialogHeader>

                  <TextField
                    name="reason"
                    label="Alasan penolakan"
                    multiline
                    rows={3}
                    required
                    placeholder="Contoh: alamat perusahaan tidak dapat diverifikasi"
                    description="Minimal 10 karakter."
                    error={rejectState?.fieldErrors?.reason}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRejectOpen(false)}
                    >
                      Batal
                    </Button>
                    <SubmitButton variant="destructive" pendingText="Menolak…">
                      Tolak Pengajuan
                    </SubmitButton>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusChip({ status }: { status: AgentListItem["approvalStatus"] }) {
  if (status === "APPROVED") {
    return (
      <span className="bg-success-soft text-success-foreground border-success/25 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium">
        <Check className="size-3.5" aria-hidden />
        Disetujui
      </span>
    )
  }

  if (status === "REJECTED") {
    return (
      <span className="bg-danger-soft text-danger-foreground border-danger/25 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium">
        <XCircle className="size-3.5" aria-hidden />
        Ditolak
      </span>
    )
  }

  return (
    <span className="bg-warning-soft text-warning-foreground border-warning/30 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium">
      <Clock className="size-3.5" aria-hidden />
      Menunggu
    </span>
  )
}
