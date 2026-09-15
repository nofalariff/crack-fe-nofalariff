"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveRouteAction, type AdminActionState } from "@/lib/actions/admin"
import { SERVICE_TYPES, getServiceMeta } from "@/lib/constants/service-type"
import type { AdminRoute, ServiceType } from "@/types/api"

/**
 * Tambah atau ubah rute (FR-RATE-03).
 *
 * Jenis layanan dan kode tujuan dikunci saat mengubah: keduanya menjadi
 * identitas rute yang sudah dipakai kiriman berjalan.
 */
export function RouteDialog({
  route,
  trigger,
}: {
  route?: AdminRoute
  trigger?: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serviceType, setServiceType] = useState<ServiceType>(
    route?.serviceType ?? "PORT_TO_PORT"
  )
  const [state, setState] = useState<AdminActionState>()

  const isEdit = Boolean(route)

  async function handleSubmit(formData: FormData) {
    const result = await saveRouteAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Rute disimpan.")
      setState(undefined)
      setOpen(false)
      router.refresh()
      return
    }

    setState(result)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setState(undefined)
  }

  const errors = state?.fieldErrors ?? {}

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus aria-hidden />
            Tambah Rute
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form action={handleSubmit} className="space-y-5">
          {route && <input type="hidden" name="routeId" value={route.id} />}
          {isEdit && (
            <>
              <input
                type="hidden"
                name="serviceType"
                value={route!.serviceType}
              />
              <input
                type="hidden"
                name="destinationCode"
                value={route!.destinationCode}
              />
            </>
          )}

          <DialogHeader>
            <DialogTitle>{isEdit ? "Ubah Rute" : "Tambah Rute"}</DialogTitle>
            <DialogDescription>
              Rute dikelola sebagai data, sehingga menambah tujuan baru tidak
              memerlukan pembaruan aplikasi.
            </DialogDescription>
          </DialogHeader>

          {state?.message && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {isEdit ? (
            <p className="bg-muted/60 text-muted-foreground rounded-md px-3 py-2 text-sm">
              {getServiceMeta(route!.serviceType).label} ·{" "}
              <span className="font-mono">{route!.destinationCode}</span> —
              jenis layanan dan kode tujuan tidak dapat diubah karena sudah
              melekat pada kiriman yang berjalan.
            </p>
          ) : (
            <>
              <Field data-invalid={!!errors.serviceType}>
                <FieldLabel htmlFor="route-service">Jenis layanan</FieldLabel>
                <Select
                  name="serviceType"
                  value={serviceType}
                  onValueChange={(value) =>
                    setServiceType(value as ServiceType)
                  }
                >
                  <SelectTrigger id="route-service" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getServiceMeta(type).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.serviceType}</FieldError>
              </Field>

              <TextField
                name="destinationCode"
                label="Kode tujuan"
                required
                placeholder="Contoh: BPN atau SULSEL"
                description="Kode bandara untuk Port to Port, atau kode zona untuk Port to Door."
                error={errors.destinationCode}
              />
            </>
          )}

          <TextField
            name="destinationName"
            label="Nama tujuan"
            required
            defaultValue={route?.destinationName}
            placeholder="Contoh: Balikpapan (BPN)"
            error={errors.destinationName}
          />

          <TextField
            name="destinationRegion"
            label="Wilayah"
            required
            defaultValue={route?.destinationRegion}
            placeholder="Contoh: Kalimantan Timur"
            error={errors.destinationRegion}
          />

          <TextField
            name="estimatedDays"
            label="Estimasi hari sampai"
            type="number"
            min="1"
            max="30"
            inputMode="numeric"
            required
            defaultValue={route?.estimatedDays ?? 3}
            description="Ditampilkan di kalkulator ongkir dan halaman layanan."
            error={errors.estimatedDays}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <SubmitButton pendingText="Menyimpan…">
              {isEdit ? "Simpan Perubahan" : "Tambah Rute"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
