import { getStatusMeta, type StatusTone } from "@/lib/constants/shipment-status"
import { cn } from "@/lib/utils"
import type { ShipmentStatus } from "@/types/api"

/**
 * Badge status kiriman.
 *
 * Warna selalu disertai label dan ikon, sehingga status tidak pernah dibedakan
 * hanya oleh warna (NFR-UX-03). Label diambil dari satu sumber di
 * `lib/constants/shipment-status.ts`.
 */

const toneClass: Record<StatusTone, string> = {
  brand: "bg-brand-soft text-brand-foreground border-brand/20",
  cta: "bg-cta-soft text-cta-foreground border-cta/25",
  success: "bg-success-soft text-success-foreground border-success/25",
  warning: "bg-warning-soft text-warning-foreground border-warning/30",
  info: "bg-info-soft text-info-foreground border-info/25",
  danger: "bg-danger-soft text-danger-foreground border-danger/25",
  muted: "bg-muted text-muted-foreground border-border",
}

export function StatusBadge({
  status,
  className,
  size = "default",
}: {
  status: ShipmentStatus
  className?: string
  size?: "default" | "sm"
}) {
  const meta = getStatusMeta(status)
  const Icon = meta.icon

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        toneClass[meta.tone],
        className
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
      {meta.label}
    </span>
  )
}
