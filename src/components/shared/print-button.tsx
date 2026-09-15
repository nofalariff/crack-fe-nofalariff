"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Cetak halaman lewat dialog cetak browser (bisa disimpan sebagai PDF). */
export function PrintButton({ label = "Cetak" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer aria-hidden />
      {label}
    </Button>
  )
}
