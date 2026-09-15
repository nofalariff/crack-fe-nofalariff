"use client"

import { useActionState, useMemo, useState } from "react"
import { AlertCircle, PackageCheck } from "lucide-react"

import { CostSummary } from "@/components/booking/cost-summary"
import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createWalkInAction, type AdminActionState } from "@/lib/actions/admin"
import { PROHIBITED_ITEMS_AGREEMENT } from "@/lib/constants/prohibited-items"
import { SERVICE_TYPES, getServiceMeta } from "@/lib/constants/service-type"
import type { AdminUser, Route, ServiceType } from "@/types/api"

const WALK_IN = "__walk_in__"

/**
 * Booking yang dibuat admin di counter (FR-BOOK-01).
 *
 * Berbeda dari wizard sisi customer: admin bekerja cepat dan sudah paham
 * prosesnya, jadi seluruh isian ditampilkan sekaligus dalam satu halaman.
 */
export function WalkInForm({
  routes,
  customers,
  adminName,
  adminPhone,
}: {
  routes: Route[]
  customers: AdminUser[]
  adminName: string
  adminPhone: string
}) {
  const [state, formAction] = useActionState<
    AdminActionState | undefined,
    FormData
  >(createWalkInAction, undefined)

  const [serviceType, setServiceType] = useState<ServiceType>("PORT_TO_PORT")
  const [destinationCode, setDestinationCode] = useState("")
  const [weight, setWeight] = useState("")
  const [onBehalfOf, setOnBehalfOf] = useState(WALK_IN)
  const [agreed, setAgreed] = useState(false)

  const availableRoutes = useMemo(
    () => routes.filter((route) => route.serviceType === serviceType),
    [routes, serviceType]
  )

  const meta = getServiceMeta(serviceType)
  const errors = state?.fieldErrors ?? {}
  const selectedCustomer = customers.find((item) => item.id === onBehalfOf)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <form action={formAction} className="min-w-0 space-y-6">
        <input type="hidden" name="serviceType" value={serviceType} />
        <input type="hidden" name="destinationCode" value={destinationCode} />
        {onBehalfOf !== WALK_IN && (
          <input type="hidden" name="onBehalfOfUserId" value={onBehalfOf} />
        )}
        {agreed && (
          <input type="hidden" name="prohibitedItemsAgreed" value="true" />
        )}

        {state?.message && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Atas nama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field>
              <FieldLabel htmlFor="walkin-customer">Akun customer</FieldLabel>
              <Select value={onBehalfOf} onValueChange={setOnBehalfOf}>
                <SelectTrigger id="walkin-customer" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WALK_IN}>
                    Walk-in (tanpa akun customer)
                  </SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.fullName} · {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {selectedCustomer
                  ? `Kiriman akan tampil di dashboard ${selectedCustomer.fullName}.`
                  : "Kiriman tercatat atas nama Anda sebagai pencatat counter."}
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layanan &amp; tujuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field data-invalid={!!errors.serviceType}>
              <FieldLabel htmlFor="walkin-service">Jenis layanan</FieldLabel>
              <Select
                value={serviceType}
                onValueChange={(value) => {
                  setServiceType(value as ServiceType)
                  setDestinationCode("")
                }}
              >
                <SelectTrigger id="walkin-service" className="w-full">
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
              <FieldDescription>{meta.endpointNote}</FieldDescription>
              <FieldError>{errors.serviceType}</FieldError>
            </Field>

            <Field data-invalid={!!errors.destinationCode}>
              <FieldLabel htmlFor="walkin-destination">Tujuan</FieldLabel>
              <Select
                value={destinationCode}
                onValueChange={setDestinationCode}
              >
                <SelectTrigger id="walkin-destination" className="w-full">
                  <SelectValue placeholder="Pilih tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoutes.map((route) => (
                    <SelectItem key={route.id} value={route.destinationCode}>
                      {route.destinationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.destinationCode}</FieldError>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                name="declaredWeight"
                label="Berat (kg)"
                type="number"
                step="0.1"
                min="0.1"
                inputMode="decimal"
                required
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                error={errors.declaredWeight}
              />
              <TextField
                name="totalColli"
                label="Jumlah koli"
                type="number"
                min="1"
                inputMode="numeric"
                required
                defaultValue="1"
                error={errors.totalColli}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengirim</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="senderName"
              label="Nama pengirim"
              required
              defaultValue={selectedCustomer?.fullName ?? adminName}
              error={errors.senderName}
            />
            <TextField
              name="senderPhone"
              label="Nomor HP pengirim"
              type="tel"
              required
              defaultValue={selectedCustomer?.phone ?? adminPhone}
              error={errors.senderPhone}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penerima</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                name="recipientName"
                label="Nama penerima"
                required
                error={errors.recipientName}
              />
              <TextField
                name="recipientPhone"
                label="Nomor HP penerima"
                type="tel"
                required
                error={errors.recipientPhone}
              />
            </div>

            <TextField
              name="recipientAddress"
              label={
                meta.requiresFullAddress
                  ? "Alamat lengkap penerima"
                  : "Catatan alamat (opsional)"
              }
              multiline
              rows={3}
              required={meta.requiresFullAddress}
              description={
                meta.requiresFullAddress
                  ? "Wajib diisi lengkap — barang diantar sampai alamat ini."
                  : "Port to Port diambil sendiri di bandara tujuan."
              }
              error={errors.recipientAddress}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                name="recipientCity"
                label="Kota / kabupaten"
                required
                error={errors.recipientCity}
              />
              <TextField
                name="recipientPostalCode"
                label="Kode pos"
                placeholder="Opsional"
                error={errors.recipientPostalCode}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Barang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <TextField
              name="itemDescription"
              label="Deskripsi isi barang"
              multiline
              rows={2}
              required
              error={errors.itemDescription}
            />

            <TextField
              name="declaredValue"
              label="Perkiraan nilai barang (Rp)"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Opsional"
              error={errors.declaredValue}
            />

            <TextField
              name="notes"
              label="Catatan"
              multiline
              rows={2}
              placeholder="Opsional"
              error={errors.notes}
            />

            <Field
              orientation="horizontal"
              data-invalid={!!errors.prohibitedItemsAgreed}
            >
              <Checkbox
                id="walkin-prohibited"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <div className="space-y-1">
                <FieldLabel htmlFor="walkin-prohibited" className="font-normal">
                  Pengirim telah menyatakan: {PROHIBITED_ITEMS_AGREEMENT}
                </FieldLabel>
                {errors.prohibitedItemsAgreed && (
                  <FieldError>{errors.prohibitedItemsAgreed}</FieldError>
                )}
              </div>
            </Field>
          </CardContent>
        </Card>

        <SubmitButton pendingText="Membuat kiriman…">
          <PackageCheck aria-hidden />
          Buat Kiriman
        </SubmitButton>
      </form>

      <CostSummary
        serviceType={serviceType}
        destinationCode={destinationCode}
        weight={weight}
      />
    </div>
  )
}
