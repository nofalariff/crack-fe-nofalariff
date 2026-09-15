import { getStatusMeta } from "@/lib/constants/shipment-status"
import { formatDateTimeWIB } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ShipmentEvent } from "@/types/api"

/**
 * Linimasa status kiriman (FR-TRACK-01).
 *
 * Riwayat bersifat append-only dan ditampilkan dari yang terbaru. Status
 * terkini ditonjolkan, tetapi setiap entri tetap membawa label dan ikonnya
 * sendiri sehingga tidak bergantung pada warna semata.
 */
export function StatusTimeline({ events }: { events: ShipmentEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Belum ada riwayat status untuk kiriman ini.
      </p>
    )
  }

  return (
    <ol className="relative space-y-6">
      {events.map((event, index) => {
        const meta = getStatusMeta(event.status)
        const Icon = meta.icon
        const isCurrent = index === 0

        return (
          <li key={event.id} className="relative flex gap-4 pl-0">
            {/* Garis penghubung antar titik */}
            {index < events.length - 1 && (
              <span
                aria-hidden
                className="bg-border absolute top-9 left-4 h-[calc(100%+0.5rem)] w-px -translate-x-1/2"
              />
            )}

            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>

            <div className="min-w-0 flex-1 pb-1">
              <p
                className={cn(
                  "text-sm",
                  isCurrent ? "font-semibold" : "font-medium"
                )}
              >
                {meta.label}
                {isCurrent && (
                  <span className="bg-primary/10 text-primary ml-2 rounded-full px-2 py-0.5 text-xs font-medium">
                    Status saat ini
                  </span>
                )}
              </p>

              <p className="text-muted-foreground mt-0.5 text-xs">
                <time dateTime={event.createdAt}>
                  {formatDateTimeWIB(event.createdAt)}
                </time>
                {event.location && <> · {event.location}</>}
              </p>

              {isCurrent && (
                <p className="text-muted-foreground mt-1.5 text-sm">
                  {meta.description}
                </p>
              )}

              {event.notes && (
                <p className="bg-muted/60 mt-1.5 rounded-md px-3 py-2 text-sm">
                  {event.notes}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
