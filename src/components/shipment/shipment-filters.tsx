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
import { SERVICE_TYPES, getServiceMeta } from "@/lib/constants/service-type"
import {
  SHIPMENT_STATUS_ORDER,
  getStatusMeta,
} from "@/lib/constants/shipment-status"

const ALL = "__semua__"

/**
 * Filter daftar kiriman.
 *
 * Seluruh filter disimpan di URL, bukan di state komponen — supaya hasil filter
 * bisa di-bookmark, dibagikan, dan bertahan setelah halaman di-refresh.
 */
export function ShipmentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const status = searchParams.get("status") ?? ALL
  const serviceType = searchParams.get("serviceType") ?? ALL
  const search = searchParams.get("search") ?? ""
  const dateFrom = searchParams.get("dateFrom") ?? ""
  const dateTo = searchParams.get("dateTo") ?? ""

  const hasFilter = Boolean(
    searchParams.get("status") ??
    searchParams.get("serviceType") ??
    searchParams.get("search") ??
    searchParams.get("dateFrom") ??
    searchParams.get("dateTo")
  )

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === ALL) params.delete(key)
      else params.set(key, value)
    }

    // Setiap perubahan filter mengembalikan ke halaman pertama.
    params.delete("page")

    startTransition(() => {
      router.push(`/kiriman?${params.toString()}`)
    })
  }

  function handleSearch(formData: FormData) {
    apply({ search: String(formData.get("search") ?? "").trim() || null })
  }

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <form action={handleSearch} className="flex gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="filter-search">Cari</Label>
          <Input
            key={search}
            id="filter-search"
            name="search"
            defaultValue={search}
            placeholder="Nomor resi atau nama penerima"
          />
        </div>
        <Button type="submit" variant="secondary" className="mt-6.5">
          {isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Search aria-hidden />
          )}
          <span className="sr-only sm:not-sr-only">Cari</span>
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => apply({ status: value })}
          >
            <SelectTrigger id="filter-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua status</SelectItem>
              {SHIPMENT_STATUS_ORDER.map((item) => (
                <SelectItem key={item} value={item}>
                  {getStatusMeta(item).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-service">Layanan</Label>
          <Select
            value={serviceType}
            onValueChange={(value) => apply({ serviceType: value })}
          >
            <SelectTrigger id="filter-service" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua layanan</SelectItem>
              {SERVICE_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {getServiceMeta(item).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-date-from">Dari tanggal</Label>
          <Input
            id="filter-date-from"
            type="date"
            defaultValue={dateFrom}
            onChange={(event) =>
              apply({ dateFrom: event.target.value || null })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-date-to">Sampai tanggal</Label>
          <Input
            id="filter-date-to"
            type="date"
            defaultValue={dateTo}
            onChange={(event) => apply({ dateTo: event.target.value || null })}
          />
        </div>
      </div>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            apply({
              status: null,
              serviceType: null,
              search: null,
              dateFrom: null,
              dateTo: null,
            })
          }
        >
          <X aria-hidden />
          Hapus semua filter
        </Button>
      )}
    </div>
  )
}
