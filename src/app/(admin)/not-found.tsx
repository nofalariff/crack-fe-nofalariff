import Link from "next/link"
import { PackageSearch } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
        <PackageSearch className="size-6" aria-hidden />
      </span>
      <h1 className="text-lg font-semibold">Data tidak ditemukan</h1>
      <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
        Halaman atau data yang Anda cari tidak ada, atau sudah tidak tersedia.
      </p>
      <Button asChild className="mt-6">
        <Link href="/admin/kiriman">Lihat daftar kiriman</Link>
      </Button>
    </div>
  )
}
