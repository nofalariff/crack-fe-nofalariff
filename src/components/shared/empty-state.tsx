import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Tampilan kondisi kosong. Selalu menjelaskan langkah berikutnya, bukan sekadar
 * menyatakan "tidak ada data" (NFR-UX-06).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center",
        className
      )}
    >
      <span className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
        {description}
      </p>
      {action && (
        <Button asChild className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}
