import Link from "next/link"
import { PackageOpen } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Wordmark sementara. Bila nanti tersedia berkas logo resmi, cukup ganti isi
 * komponen ini — tidak ada halaman yang menyusun logonya sendiri.
 */
export function Logo({
  href = "/",
  className,
  showText = true,
}: {
  href?: string | null
  className?: string
  showText?: boolean
}) {
  const content = (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
        <PackageOpen className="size-5" aria-hidden />
      </span>
      {showText && (
        <span className="text-lg tracking-tight">
          Logi<span className="text-cta">Send</span>
        </span>
      )}
    </span>
  )

  if (!href) return content

  return (
    <Link href={href} aria-label="LogiSend — ke beranda">
      {content}
    </Link>
  )
}
