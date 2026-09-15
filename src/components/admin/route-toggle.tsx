"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"
import { toggleRouteActiveAction } from "@/lib/actions/admin"

/**
 * Aktifkan / nonaktifkan rute (FR-RATE-03).
 *
 * Rute tidak pernah dihapus, hanya dinonaktifkan — kiriman yang sedang berjalan
 * pada rute itu harus tetap punya rujukan yang utuh.
 */
export function RouteToggle({
  routeId,
  routeName,
  isActive,
  disabled,
}: {
  routeId: string
  routeName: string
  isActive: boolean
  disabled?: boolean
}) {
  const router = useRouter()
  const [checked, setChecked] = useState(isActive)
  const [pending, startTransition] = useTransition()

  function handleChange(next: boolean) {
    setChecked(next)

    startTransition(async () => {
      const formData = new FormData()
      formData.set("routeId", routeId)
      if (next) formData.set("isActive", "true")

      const result = await toggleRouteActiveAction(undefined, formData)

      if (result?.success) {
        toast.success(result.message ?? "Status rute diperbarui.")
        router.refresh()
        return
      }

      // Kembalikan tampilan ke keadaan sebenarnya bila server menolak.
      setChecked(!next)
      toast.error(result?.message ?? "Gagal mengubah status rute.")
    })
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={checked}
        disabled={disabled || pending}
        onCheckedChange={(value) => handleChange(value === true)}
        aria-label={`${checked ? "Nonaktifkan" : "Aktifkan"} rute ${routeName}`}
      />
      <span className={checked ? "" : "text-muted-foreground"}>
        {checked ? "Aktif" : "Nonaktif"}
      </span>
    </label>
  )
}
