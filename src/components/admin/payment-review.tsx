"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, FileText, X } from "lucide-react"
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
  rejectPaymentAction,
  verifyPaymentAction,
  type AdminActionState,
} from "@/lib/actions/admin"
import { PAYMENT_RECORD_STATUS_LABEL } from "@/lib/constants/shipment-status"
import { formatDateTimeWIB, formatRupiah } from "@/lib/format"
import type { PaymentQueueItem } from "@/types/api"

/**
 * Kartu tinjauan satu bukti pembayaran (FR-PAY-03/04).
 *
 * Selisih antara nominal tagihan dan nominal transfer ditandai secara visual
 * dan disertai teks, bukan hanya warna. Bukti transfer diambil lewat proxy
 * terautentikasi, bukan URL publik (NFR-SEC-07).
 */
export function PaymentReview({ item }: { item: PaymentQueueItem }) {
  const router = useRouter()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectState, setRejectState] = useState<AdminActionState>()
  const [previewFailed, setPreviewFailed] = useState(false)

  const isPending = item.status === "WAITING_VERIFICATION"
  const hasDifference = item.difference !== 0

  async function handleVerify(formData: FormData) {
    const result = await verifyPaymentAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Pembayaran diverifikasi.")
      router.refresh()
      return
    }

    toast.error(result?.message ?? "Gagal memverifikasi pembayaran.")
  }

  async function handleReject(formData: FormData) {
    const result = await rejectPaymentAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Pembayaran ditolak.")
      setRejectState(undefined)
      setRejectOpen(false)
      router.refresh()
      return
    }

    setRejectState(result)
  }

  return (
    <Card>
      <CardContent className="grid gap-5 sm:grid-cols-[10rem_1fr]">
        {/* Pratinjau bukti transfer */}
        <div className="bg-muted flex aspect-3/4 items-center justify-center overflow-hidden rounded-lg border sm:aspect-auto sm:h-44">
          {previewFailed ? (
            <span className="text-muted-foreground flex flex-col items-center gap-1 p-3 text-center text-xs">
              <FileText className="size-6" aria-hidden />
              {item.attachmentName}
            </span>
          ) : (
            <Image
              src={`/api/files/${item.attachmentId}`}
              alt={`Bukti transfer ${item.trackingNumber}`}
              width={160}
              height={176}
              unoptimized
              className="h-full w-full object-cover"
              onError={() => setPreviewFailed(true)}
            />
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/admin/kiriman/${item.trackingNumber}`}
                className="text-primary font-mono text-sm font-medium underline-offset-4 hover:underline"
              >
                {item.trackingNumber}
              </Link>
              <p className="text-sm">{item.customerName}</p>
              <p className="text-muted-foreground text-xs">
                {item.customerEmail}
              </p>
            </div>

            <span className="text-muted-foreground text-xs">
              {PAYMENT_RECORD_STATUS_LABEL[item.status]} ·{" "}
              {formatDateTimeWIB(item.submittedAt)}
            </span>
          </div>

          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Tagihan</dt>
              <dd className="font-medium">{formatRupiah(item.totalAmount)}</dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Nominal transfer</dt>
              <dd className="font-medium">
                {formatRupiah(item.claimedAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Nama rekening pengirim</dt>
              <dd>{item.senderAccountName}</dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Tanggal transfer</dt>
              <dd>{formatDateTimeWIB(item.transferDate)}</dd>
            </div>
          </dl>

          {hasDifference && (
            <p className="border-warning/40 bg-warning-soft text-warning-foreground flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Nominal transfer{" "}
                {item.difference > 0 ? "lebih besar" : "lebih kecil"}{" "}
                {formatRupiah(Math.abs(item.difference))} dari tagihan. Periksa
                sebelum menyetujui.
              </span>
            </p>
          )}

          {item.status === "REJECTED" && (
            <p className="text-muted-foreground text-sm">
              Bukti ini sudah ditolak. Customer dapat mengunggah ulang.
            </p>
          )}

          {isPending && (
            <div className="flex flex-wrap gap-2">
              <form action={handleVerify}>
                <input type="hidden" name="paymentId" value={item.paymentId} />
                <input
                  type="hidden"
                  name="trackingNumber"
                  value={item.trackingNumber}
                />
                <SubmitButton pendingText="Memverifikasi…">
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
                    <input
                      type="hidden"
                      name="paymentId"
                      value={item.paymentId}
                    />
                    <input
                      type="hidden"
                      name="trackingNumber"
                      value={item.trackingNumber}
                    />

                    <DialogHeader>
                      <DialogTitle>Tolak bukti pembayaran</DialogTitle>
                      <DialogDescription>
                        Alasan ini ditampilkan kepada customer agar mereka tahu
                        apa yang harus diperbaiki sebelum mengunggah ulang.
                      </DialogDescription>
                    </DialogHeader>

                    <TextField
                      name="reason"
                      label="Alasan penolakan"
                      multiline
                      rows={3}
                      required
                      placeholder="Contoh: nominal transfer tidak sesuai tagihan"
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
                      <SubmitButton
                        variant="destructive"
                        pendingText="Menolak…"
                      >
                        Tolak Pembayaran
                      </SubmitButton>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
