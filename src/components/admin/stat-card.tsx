import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Kartu angka untuk dashboard operasional.
 *
 * `tone` hanya menegaskan urgensi; angka dan labelnya sudah menyampaikan arti
 * sepenuhnya, sehingga tidak ada informasi yang bergantung pada warna semata.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "neutral",
}: {
  label: string
  value: number
  hint?: string
  icon: LucideIcon
  href?: string
  tone?: "neutral" | "attention" | "positive"
}) {
  const needsAttention = tone === "attention" && value > 0

  const content = (
    <Card
      className={cn(
        "h-full transition-colors",
        href && "group-hover:border-primary/40",
        needsAttention && "border-warning/40 bg-warning-soft/40"
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-muted-foreground text-sm">{label}</p>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              needsAttention
                ? "bg-warning/15 text-warning-foreground"
                : tone === "positive"
                  ? "bg-success/15 text-success-foreground"
                  : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        </div>

        <p className="text-3xl font-semibold tabular-nums">{value}</p>

        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}

        {href && (
          <p className="text-primary flex items-center gap-1 text-sm">
            Lihat
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (!href) return content

  return (
    <Link href={href} className="group block">
      {content}
    </Link>
  )
}
