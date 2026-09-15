"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Layers, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge } from "@/components/shipment/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { bulkStatusAction } from "@/lib/actions/admin"
import { getServiceMeta } from "@/lib/constants/service-type"
import {
  PAYMENT_STATUS_LABEL,
  SHIPMENT_STATUS_ORDER,
  getStatusMeta,
} from "@/lib/constants/shipment-status"
import { formatDateShort, formatRupiah, formatWeight } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AdminShipmentSummary, BulkStatusResult } from "@/types/api"

/**
 * Tabel kiriman dengan pemilihan baris dan aksi massal (FR-ADM-01, FR-TRACK-03).
 *
 * Status yang menuntut keterangan khas per kiriman — Diterima (butuh nama
 * penerima), Tertahan dan Dibatalkan (butuh alasan) — sengaja tidak ditawarkan
 * di aksi massal, karena satu alasan yang sama untuk banyak kiriman tidak
 * bermakna.
 */
const BULK_STATUSES = SHIPMENT_STATUS_ORDER.filter(
  (status) =>
    !["DELIVERED", "ON_HOLD", "CANCELLED", "PENDING_PAYMENT"].includes(status)
)

export function AdminShipmentTable({
  shipments,
}: {
  shipments: AdminShipmentSummary[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<string>("")
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<BulkStatusResult | null>(null)

  const allSelected =
    shipments.length > 0 && selected.length === shipments.length

  function toggleAll(checked: boolean) {
    setSelected(checked ? shipments.map((shipment) => shipment.id) : [])
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    )
  }

  async function applyBulk() {
    if (!bulkStatus || selected.length === 0) return

    setPending(true)
    setResult(null)

    const formData = new FormData()
    selected.forEach((id) => formData.append("shipmentIds", id))
    formData.set("status", bulkStatus)

    const state = await bulkStatusAction(undefined, formData)
    setPending(false)

    if (state?.bulkResult) {
      setResult(state.bulkResult)
      if (state.bulkResult.updatedCount > 0) {
        toast.success(state.message ?? "Status diperbarui.")
        setSelected([])
        router.refresh()
      } else {
        toast.error("Tidak ada kiriman yang dapat diperbarui.")
      }
      return
    }

    toast.error(state?.message ?? "Gagal memperbarui status.")
  }

  return (
    <div className="space-y-4">
      {/* Bilah aksi massal hanya muncul saat ada baris terpilih */}
      {selected.length > 0 && (
        <div className="bg-primary/5 border-primary/30 flex flex-wrap items-end gap-3 rounded-xl border p-4">
          <p className="mr-auto flex items-center gap-2 text-sm font-medium">
            <Layers className="size-4" aria-hidden />
            {selected.length} kiriman dipilih
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-status">Ubah status menjadi</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger id="bulk-status" className="w-56">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {BULK_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusMeta(status).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={applyBulk} disabled={!bulkStatus || pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Terapkan
          </Button>

          <Button variant="ghost" onClick={() => setSelected([])}>
            <X aria-hidden />
            Batal
          </Button>
        </div>
      )}

      {/* Hasil aksi massal dilaporkan apa adanya, termasuk yang dilewati */}
      {result && result.skipped.length > 0 && (
        <div className="border-warning/40 bg-warning-soft rounded-xl border p-4">
          <p className="text-warning-foreground flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4" aria-hidden />
            {result.updatedCount} berhasil, {result.skipped.length} dilewati
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {result.skipped.map((item) => (
              <li key={item.trackingNumber} className="text-muted-foreground">
                <span className="font-mono">{item.trackingNumber}</span> —{" "}
                {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  aria-label="Pilih semua kiriman di halaman ini"
                />
              </TableHead>
              <TableHead>Nomor Resi</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Tujuan</TableHead>
              <TableHead>Berat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bayar</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Diperbarui</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {shipments.map((shipment) => {
              const isSelected = selected.includes(shipment.id)
              const stalled =
                shipment.daysSinceUpdate > 3 &&
                !["DELIVERED", "CANCELLED"].includes(shipment.status)

              return (
                <TableRow
                  key={shipment.id}
                  data-state={isSelected ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        toggleOne(shipment.id, checked === true)
                      }
                      aria-label={`Pilih ${shipment.trackingNumber}`}
                    />
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/admin/kiriman/${shipment.trackingNumber}`}
                      className="text-primary font-mono text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {shipment.trackingNumber}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {getServiceMeta(shipment.serviceType).label}
                    </p>
                  </TableCell>

                  <TableCell>
                    <p className="text-sm">{shipment.customerName}</p>
                    <p className="text-muted-foreground text-xs">
                      {shipment.customerRole === "AGENT"
                        ? "Agen"
                        : "Perorangan"}
                    </p>
                  </TableCell>

                  <TableCell>
                    <p className="text-sm">{shipment.destinationName}</p>
                    <p className="text-muted-foreground text-xs">
                      {shipment.recipientName}
                    </p>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {formatWeight(shipment.chargeableWeight)}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={shipment.status} size="sm" />
                  </TableCell>

                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {PAYMENT_STATUS_LABEL[shipment.paymentStatus]}
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    {formatRupiah(shipment.totalAmount)}
                  </TableCell>

                  <TableCell
                    className={cn(
                      "text-right text-xs whitespace-nowrap",
                      stalled
                        ? "text-warning-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDateShort(shipment.updatedAt)}
                    {stalled && (
                      <span className="block">
                        {shipment.daysSinceUpdate} hari lalu
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
