"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-full">
        <AlertCircle className="size-6" aria-hidden />
      </span>
      <h1 className="text-lg font-semibold">Halaman gagal dimuat</h1>
      <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
        Terjadi gangguan saat mengambil data. Silakan coba lagi beberapa saat
        lagi.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Coba lagi</Button>
        <Button asChild variant="outline">
          <Link href="/admin">Kembali ke dashboard admin</Link>
        </Button>
      </div>
    </div>
  )
}
