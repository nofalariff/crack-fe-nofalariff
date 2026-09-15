import Link from "next/link"

import {
  SHIPMENT_STATUS_ORDER,
  getStatusMeta,
  type StatusTone,
} from "@/lib/constants/shipment-status"
import type { ShipmentStatus } from "@/types/api"

/**
 * Sebaran kiriman per status.
 *
 * Sengaja berupa daftar magnitudo berlabel, bukan bar chart berkunci warna:
 * setiap baris membawa ikon, nama status, dan angkanya sendiri, sehingga tidak
 * ada makna yang hanya disampaikan lewat warna (NFR-UX-03) — dan warna status
 * yang berulang antar baris tidak menjadi masalah. Panjang bar dibaca relatif
 * terhadap status terbanyak.
 */

const barClass: Record<StatusTone, string> = {
  brand: "bg-brand",
  cta: "bg-cta",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-danger",
  muted: "bg-muted-foreground",
}

export function StatusDistribution({
  counts,
}: {
  counts: Partial<Record<ShipmentStatus, number>>
}) {
  const rows = SHIPMENT_STATUS_ORDER.map((status) => ({
    status,
    count: counts[status] ?? 0,
  }))

  const total = rows.reduce((sum, row) => sum + row.count, 0)
  const max = Math.max(1, ...rows.map((row) => row.count))

  if (total === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Belum ada kiriman yang tercatat.
      </p>
    )
  }

  return (
    <ul className="space-y-2.5">
      {rows.map(({ status, count }) => {
        const meta = getStatusMeta(status)
        const Icon = meta.icon
        const share = Math.round((count / max) * 100)

        return (
          <li key={status}>
            <Link
              href={`/admin/kiriman?status=${status}`}
              className="group hover:bg-muted/60 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-1 py-1 transition-colors"
            >
              <span className="text-muted-foreground flex w-44 items-center gap-2 text-sm">
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{meta.label}</span>
              </span>

              <span
                className="bg-muted h-2 overflow-hidden rounded-full"
                aria-hidden
              >
                <span
                  className={`block h-full rounded-full ${barClass[meta.tone]}`}
                  style={{ width: `${Math.max(count > 0 ? 4 : 0, share)}%` }}
                />
              </span>

              <span className="w-8 text-right text-sm font-medium tabular-nums">
                {count}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
