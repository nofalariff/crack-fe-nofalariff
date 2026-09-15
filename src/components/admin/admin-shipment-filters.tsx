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
  PAYMENT_STATUS_LABEL,
  SHIPMENT_STATUS_ORDER,
  getStatusMeta,
} from "@/lib/constants/shipment-status"
import type { Route } from "@/types/api"

const ALL = "__semua__"

const FILTER_KEYS = [
  "status",
  "serviceType",
  "destinationCode",
  "paymentStatus",
  "search",
  "dateFrom",
  "dateTo",
] as const

/**
 * Filter daftar kiriman admin (FR-ADM-01).
 *
 * Sama seperti sisi customer, seluruh filter hidup di URL — hasil penyaringan
 * bisa dibagikan ke rekan kerja lewat tautan dan tahan refresh.
 */
export function AdminShipmentFilters({ routes }: { routes: Route[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const value = (key: string) => searchParams.get(key) ?? ALL
  const hasFilter = FILTER_KEYS.some((key) => searchParams.get(key))

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, next] of Object.entries(updates)) {
      if (!next || next === ALL) params.delete(key)
      else params.set(key, next)
    }

    params.delete("page")

    startTransition(() => {
      router.push(`/admin/kiriman?${params.toString()}`)
    })
  }

  function handleSearch(formData: FormData) {
    apply({ search: String(formData.get("search") ?? "").trim() || null })
  }

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <form action={handleSearch} className="flex gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="admin-search">Cari</Label>
          <Input
            key={searchParams.get("search") ?? ""}
            id="admin-search"
            name="search"
            defaultValue={searchParams.get("search") ?? ""}
            placeholder="Nomor resi, nama pengirim/penerima, atau nomor HP"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="admin-filter-status">Status</Label>
          <Select
            value={value("status")}
            onValueChange={(next) => apply({ status: next })}
          >
            <SelectTrigger id="admin-filter-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua status</SelectItem>
              {SHIPMENT_STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusMeta(status).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-filter-service">Layanan</Label>
          <Select
            value={value("serviceType")}
            onValueChange={(next) =>
              apply({ serviceType: next, destinationCode: null })
            }
          >
            <SelectTrigger id="admin-filter-service" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua layanan</SelectItem>
              {SERVICE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {getServiceMeta(type).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-filter-route">Rute</Label>
          <Select
            value={value("destinationCode")}
            onValueChange={(next) => apply({ destinationCode: next })}
          >
            <SelectTrigger id="admin-filter-route" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua rute</SelectItem>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.destinationCode}>
                  {route.destinationName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-filter-payment">Pembayaran</Label>
          <Select
            value={value("paymentStatus")}
            onValueChange={(next) => apply({ paymentStatus: next })}
          >
            <SelectTrigger id="admin-filter-payment" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua status bayar</SelectItem>
              {Object.entries(PAYMENT_STATUS_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-filter-from">Dari tanggal</Label>
          <Input
            id="admin-filter-from"
            type="date"
            defaultValue={searchParams.get("dateFrom") ?? ""}
            onChange={(event) =>
              apply({ dateFrom: event.target.value || null })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-filter-to">Sampai tanggal</Label>
          <Input
            id="admin-filter-to"
            type="date"
            defaultValue={searchParams.get("dateTo") ?? ""}
            onChange={(event) => apply({ dateTo: event.target.value || null })}
          />
        </div>
      </div>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            apply(Object.fromEntries(FILTER_KEYS.map((key) => [key, null])))
          }
        >
          <X aria-hidden />
          Hapus semua filter
        </Button>
      )}
    </div>
  )
}
