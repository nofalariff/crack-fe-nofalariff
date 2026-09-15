import Link from "next/link"
import { ArrowRight, MapPin, Weight } from "lucide-react"

import { StatusBadge } from "@/components/shipment/status-badge"
import { getServiceMeta } from "@/lib/constants/service-type"
import { formatDateShort, formatRupiah, formatWeight } from "@/lib/format"
import type { ShipmentSummary } from "@/types/api"

/** Ringkasan satu kiriman — dipakai di dashboard dan daftar kiriman mobile. */
export function ShipmentCard({ shipment }: { shipment: ShipmentSummary }) {
  const service = getServiceMeta(shipment.serviceType)

  return (
    <Link
      href={`/kirim/${shipment.trackingNumber}`}
      className="group hover:border-primary/40 hover:bg-muted/40 block rounded-xl border p-4 transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium">
            {shipment.trackingNumber}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {service.label} · {formatDateShort(shipment.createdAt)}
          </p>
        </div>
        <StatusBadge status={shipment.status} size="sm" />
      </div>

      <div className="mt-3 space-y-1.5 text-sm">
        <p className="flex items-center gap-2">
          <MapPin
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden
          />
          <span className="truncate">
            {shipment.recipientName} · {shipment.destinationName}
          </span>
        </p>
        <p className="text-muted-foreground flex items-center gap-2">
          <Weight className="size-4 shrink-0" aria-hidden />
          {formatWeight(shipment.chargeableWeight)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
        <span className="font-medium">
          {formatRupiah(shipment.totalAmount)}
        </span>
        <span className="text-primary flex items-center gap-1 text-sm">
          Detail
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  )
}
