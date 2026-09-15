import Link from "next/link"

import { Button } from "@/components/ui/button"

/**
 * Navigasi halaman berbasis tautan.
 *
 * Nomor halaman ikut tersimpan di URL, sehingga posisi daftar bisa dibagikan
 * dan tahan refresh — sejalan dengan filter yang juga hidup di URL.
 */
export function PaginationNav({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number
  totalPages: number
  basePath: string
  params: Record<string, string | string[] | undefined>
}) {
  if (totalPages <= 1) return null

  function hrefFor(target: number) {
    const next = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && key !== "page") next.set(key, value)
    }
    if (target > 1) next.set("page", String(target))

    const query = next.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  return (
    <nav
      aria-label="Navigasi halaman"
      className="flex items-center justify-between gap-3"
    >
      <Button
        asChild={page > 1}
        variant="outline"
        size="sm"
        disabled={page <= 1}
      >
        {page > 1 ? (
          <Link href={hrefFor(page - 1)}>Sebelumnya</Link>
        ) : (
          <span>Sebelumnya</span>
        )}
      </Button>

      <p className="text-muted-foreground text-sm">
        Halaman {page} dari {totalPages}
      </p>

      <Button
        asChild={page < totalPages}
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
      >
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)}>Berikutnya</Link>
        ) : (
          <span>Berikutnya</span>
        )}
      </Button>
    </nav>
  )
}
