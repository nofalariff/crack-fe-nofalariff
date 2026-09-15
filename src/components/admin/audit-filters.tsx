"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AUDIT_ACTIONS, AUDIT_ACTION_LABEL } from "@/lib/constants/audit"

const ALL = "__semua__"

export function AuditFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const hasFilter = ["action", "dateFrom", "dateTo"].some((key) =>
    searchParams.get(key)
  )

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, next] of Object.entries(updates)) {
      if (!next || next === ALL) params.delete(key)
      else params.set(key, next)
    }

    params.delete("page")
    startTransition(() => router.push(`/admin/audit-log?${params.toString()}`))
  }

  return (
    <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="audit-action">Jenis aksi</Label>
        <Select
          value={searchParams.get("action") ?? ALL}
          onValueChange={(next) => apply({ action: next })}
        >
          <SelectTrigger id="audit-action" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua aksi</SelectItem>
            {AUDIT_ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {AUDIT_ACTION_LABEL[action]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="audit-from">Dari tanggal</Label>
        <Input
          id="audit-from"
          type="date"
          defaultValue={searchParams.get("dateFrom") ?? ""}
          onChange={(event) => apply({ dateFrom: event.target.value || null })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="audit-to">Sampai tanggal</Label>
        <Input
          id="audit-to"
          type="date"
          defaultValue={searchParams.get("dateTo") ?? ""}
          onChange={(event) => apply({ dateTo: event.target.value || null })}
        />
      </div>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit sm:col-span-3"
          onClick={() => apply({ action: null, dateFrom: null, dateTo: null })}
        >
          <X aria-hidden />
          Hapus semua filter
        </Button>
      )}
    </div>
  )
}
