"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Loader2, Search, X } from "lucide-react"

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

const ALL = "__semua__"

const ROLE_LABEL = {
  CUSTOMER: "Perorangan",
  AGENT: "Agen",
  ADMIN: "Admin",
} as const

const STATUS_LABEL = {
  ACTIVE: "Aktif",
  SUSPENDED: "Ditangguhkan",
} as const

/** Filter daftar pengguna, disimpan di URL seperti filter lain (FR-ADM-04). */
export function UserFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const hasFilter = ["role", "status", "search"].some((key) =>
    searchParams.get(key)
  )

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, next] of Object.entries(updates)) {
      if (!next || next === ALL) params.delete(key)
      else params.set(key, next)
    }

    params.delete("page")
    startTransition(() => router.push(`/admin/pengguna?${params.toString()}`))
  }

  return (
    <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[1fr_auto_auto]">
      <form
        action={(formData) =>
          apply({ search: String(formData.get("search") ?? "").trim() || null })
        }
        className="flex gap-2"
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="user-search">Cari</Label>
          <Input
            key={searchParams.get("search") ?? ""}
            id="user-search"
            name="search"
            defaultValue={searchParams.get("search") ?? ""}
            placeholder="Nama, email, atau nama perusahaan"
          />
        </div>
        <Button type="submit" variant="secondary" className="mt-6.5">
          {isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Search aria-hidden />
          )}
          <span className="sr-only">Cari</span>
        </Button>
      </form>

      <div className="space-y-1.5">
        <Label htmlFor="user-role">Role</Label>
        <Select
          value={searchParams.get("role") ?? ALL}
          onValueChange={(next) => apply({ role: next })}
        >
          <SelectTrigger id="user-role" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua role</SelectItem>
            {Object.entries(ROLE_LABEL).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-status">Status akun</Label>
        <Select
          value={searchParams.get("status") ?? ALL}
          onValueChange={(next) => apply({ status: next })}
        >
          <SelectTrigger id="user-status" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit sm:col-span-3"
          onClick={() => apply({ role: null, status: null, search: null })}
        >
          <X aria-hidden />
          Hapus semua filter
        </Button>
      )}
    </div>
  )
}

export { ROLE_LABEL, STATUS_LABEL }
