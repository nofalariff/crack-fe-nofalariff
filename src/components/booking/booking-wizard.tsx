"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowLeft, ArrowRight, PackageCheck } from "lucide-react"

import { CostSummary } from "@/components/booking/cost-summary"
import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import {
  createShipmentAction,
  type ShipmentActionState,
} from "@/lib/actions/shipments"
import {
  PROHIBITED_ITEMS,
  PROHIBITED_ITEMS_AGREEMENT,
} from "@/lib/constants/prohibited-items"
import { SERVICE_TYPES, getServiceMeta } from "@/lib/constants/service-type"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CurrentUser, Recipient, Route, ServiceType } from "@/types/api"

const STEPS = [
  { id: 1, label: "Layanan" },
  { id: 2, label: "Penerima" },
  { id: 3, label: "Barang" },
  { id: 4, label: "Ringkasan" },
]

const DRAFT_KEY = "logisend:booking-draft"

type Values = {
  serviceType: ServiceType
  destinationCode: string
  declaredWeight: string
  totalColli: string
  senderName: string
  senderPhone: string
  recipientId: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientCity: string
  recipientPostalCode: string
  itemDescription: string
  declaredValue: string
  notes: string
  saveRecipient: boolean
  prohibitedItemsAgreed: boolean
}

export function BookingWizard({
  routes,
  recipients,
  user,
  defaults,
}: {
  routes: Route[]
  recipients: Recipient[]
  user: CurrentUser
  defaults: { serviceType?: string; destinationCode?: string; weight?: string }
}) {
  const [state, formAction] = useActionState<
    ShipmentActionState | undefined,
    FormData
  >(createShipmentAction, undefined)

  const [step, setStep] = useState(1)
  const [values, setValues] = useState<Values>({
    serviceType: (defaults.serviceType as ServiceType) || "PORT_TO_PORT",
    destinationCode: defaults.destinationCode ?? "",
    declaredWeight: defaults.weight ?? "",
    totalColli: "1",
    senderName: user.fullName,
    senderPhone: user.phone,
    recipientId: "",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    recipientCity: "",
    recipientPostalCode: "",
    itemDescription: "",
    declaredValue: "",
    notes: "",
    saveRecipient: false,
    prohibitedItemsAgreed: false,
  })

  // Pulihkan draf agar isian tidak hilang saat halaman ter-refresh.
  //
  // Ini pembacaan satu kali dari penyimpanan eksternal (sessionStorage), yang
  // memang peran sah sebuah effect. Tidak bisa dipindah ke inisialisasi state
  // karena komponen ini juga dirender di server, dan sessionStorage hanya ada
  // di browser — membacanya saat inisialisasi akan memicu ketidakcocokan
  // hidrasi.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved) as Partial<Values>
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues((current) => ({
        ...current,
        ...parsed,
        // Pernyataan barang terlarang harus disetujui ulang setiap sesi.
        prohibitedItemsAgreed: false,
        // Parameter dari kalkulator ongkir tetap diprioritaskan.
        ...(defaults.serviceType
          ? { serviceType: defaults.serviceType as ServiceType }
          : {}),
        ...(defaults.destinationCode
          ? { destinationCode: defaults.destinationCode }
          : {}),
        ...(defaults.weight ? { declaredWeight: defaults.weight } : {}),
      }))
    } catch {
      // Draf rusak atau storage tidak tersedia — abaikan, form tetap jalan.
    }
  }, [defaults.serviceType, defaults.destinationCode, defaults.weight])

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    } catch {
      // Mode privat bisa menolak penulisan; bukan alasan menggagalkan form.
    }
  }, [values])

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const availableRoutes = useMemo(
    () => routes.filter((route) => route.serviceType === values.serviceType),
    [routes, values.serviceType]
  )

  const serviceMeta = getServiceMeta(values.serviceType)
  const selectedRoute = availableRoutes.find(
    (route) => route.destinationCode === values.destinationCode
  )
  const errors = state?.fieldErrors ?? {}

  function applyRecipient(id: string) {
    set("recipientId", id)
    const recipient = recipients.find((item) => item.id === id)
    if (!recipient) return

    setValues((current) => ({
      ...current,
      recipientId: id,
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      recipientAddress: recipient.address,
      recipientCity: recipient.city,
      recipientPostalCode: recipient.postalCode ?? "",
    }))
  }

  const stepOneValid = Boolean(
    values.destinationCode && Number(values.declaredWeight) > 0
  )
  const stepTwoValid = Boolean(
    values.recipientName &&
    values.recipientPhone &&
    values.recipientCity &&
    (values.serviceType === "PORT_TO_PORT" ||
      values.recipientAddress.trim().length >= 10)
  )
  const stepThreeValid = values.itemDescription.trim().length >= 3

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-6">
        {/* Penunjuk langkah */}
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {STEPS.map((item, index) => {
            const isCurrent = item.id === step
            const isDone = item.id < step

            return (
              <li key={item.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => item.id < step && setStep(item.id)}
                  disabled={item.id > step}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors",
                    isCurrent && "bg-primary text-primary-foreground",
                    isDone && "text-primary hover:bg-primary/10",
                    !isCurrent && !isDone && "text-muted-foreground"
                  )}
                >
                  <span className="font-medium tabular-nums">{item.id}</span>
                  {item.label}
                </button>
                {index < STEPS.length - 1 && (
                  <span aria-hidden className="text-muted-foreground">
                    ›
                  </span>
                )}
              </li>
            )
          })}
        </ol>

        {state?.message && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <form action={formAction}>
          {/* Seluruh nilai dikirim sebagai hidden agar langkah yang sedang
              tidak tampil tetap ikut ter-submit. */}
          <input type="hidden" name="serviceType" value={values.serviceType} />
          <input
            type="hidden"
            name="destinationCode"
            value={values.destinationCode}
          />
          <input
            type="hidden"
            name="declaredWeight"
            value={values.declaredWeight}
          />
          <input type="hidden" name="totalColli" value={values.totalColli} />
          <input type="hidden" name="senderName" value={values.senderName} />
          <input type="hidden" name="senderPhone" value={values.senderPhone} />
          <input
            type="hidden"
            name="recipientName"
            value={values.recipientName}
          />
          <input
            type="hidden"
            name="recipientPhone"
            value={values.recipientPhone}
          />
          <input
            type="hidden"
            name="recipientAddress"
            value={values.recipientAddress}
          />
          <input
            type="hidden"
            name="recipientCity"
            value={values.recipientCity}
          />
          <input
            type="hidden"
            name="recipientPostalCode"
            value={values.recipientPostalCode}
          />
          <input
            type="hidden"
            name="itemDescription"
            value={values.itemDescription}
          />
          <input
            type="hidden"
            name="declaredValue"
            value={values.declaredValue}
          />
          <input type="hidden" name="notes" value={values.notes} />
          {values.saveRecipient && (
            <input type="hidden" name="saveRecipient" value="true" />
          )}
          {values.prohibitedItemsAgreed && (
            <input type="hidden" name="prohibitedItemsAgreed" value="true" />
          )}

          {/* Langkah 1 — Layanan */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>1. Layanan &amp; tujuan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field data-invalid={!!errors.serviceType}>
                  <FieldLabel htmlFor="wizard-service">
                    Jenis layanan
                  </FieldLabel>
                  <Select
                    value={values.serviceType}
                    onValueChange={(value) => {
                      set("serviceType", value as ServiceType)
                      set("destinationCode", "")
                    }}
                  >
                    <SelectTrigger id="wizard-service" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => {
                        const meta = getServiceMeta(type)
                        return (
                          <SelectItem key={type} value={type}>
                            {meta.label} — {meta.shortLabel}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {serviceMeta.endpointNote}
                  </FieldDescription>
                  <FieldError>{errors.serviceType}</FieldError>
                </Field>

                <Field data-invalid={!!errors.destinationCode}>
                  <FieldLabel htmlFor="wizard-destination">
                    Tujuan pengiriman
                  </FieldLabel>
                  <Select
                    value={values.destinationCode}
                    onValueChange={(value) => set("destinationCode", value)}
                  >
                    <SelectTrigger id="wizard-destination" className="w-full">
                      <SelectValue placeholder="Pilih tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoutes.map((route) => (
                        <SelectItem
                          key={route.id}
                          value={route.destinationCode}
                        >
                          {route.destinationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.destinationCode}</FieldError>
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    name="declaredWeightInput"
                    label="Berat barang (kg)"
                    type="number"
                    step="0.1"
                    min="0.1"
                    inputMode="decimal"
                    required
                    value={values.declaredWeight}
                    onChange={(event) =>
                      set("declaredWeight", event.target.value)
                    }
                    description={
                      selectedRoute
                        ? `Berat minimum rute ini ${selectedRoute.minChargeableWeight} kg.`
                        : "Dibulatkan ke atas ke kelipatan 1 kg."
                    }
                    error={errors.declaredWeight}
                  />

                  <TextField
                    name="totalColliInput"
                    label="Jumlah koli"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    required
                    value={values.totalColli}
                    onChange={(event) => set("totalColli", event.target.value)}
                    description="Banyaknya kemasan dalam kiriman ini."
                    error={errors.totalColli}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!stepOneValid}
                  >
                    Lanjut ke Penerima
                    <ArrowRight aria-hidden />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Langkah 2 — Penerima */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Data penerima</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {recipients.length > 0 && (
                  <Field>
                    <FieldLabel htmlFor="wizard-recipient-book">
                      Ambil dari buku alamat
                    </FieldLabel>
                    <Select
                      value={values.recipientId}
                      onValueChange={applyRecipient}
                    >
                      <SelectTrigger
                        id="wizard-recipient-book"
                        className="w-full"
                      >
                        <SelectValue placeholder="Pilih penerima tersimpan" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            {recipient.label
                              ? `${recipient.label} — ${recipient.name}`
                              : recipient.name}
                            {" · "}
                            {recipient.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Memilih penerima tersimpan akan mengisi otomatis kolom di
                      bawah. Anda tetap bisa mengubahnya.
                    </FieldDescription>
                  </Field>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    name="recipientNameInput"
                    label="Nama penerima"
                    required
                    value={values.recipientName}
                    onChange={(event) =>
                      set("recipientName", event.target.value)
                    }
                    error={errors.recipientName}
                  />
                  <TextField
                    name="recipientPhoneInput"
                    label="Nomor HP penerima"
                    type="tel"
                    placeholder="0812-3456-7890"
                    required
                    value={values.recipientPhone}
                    onChange={(event) =>
                      set("recipientPhone", event.target.value)
                    }
                    error={errors.recipientPhone}
                  />
                </div>

                <TextField
                  name="recipientAddressInput"
                  label={
                    serviceMeta.requiresFullAddress
                      ? "Alamat lengkap penerima"
                      : "Catatan alamat (opsional)"
                  }
                  multiline
                  rows={3}
                  required={serviceMeta.requiresFullAddress}
                  value={values.recipientAddress}
                  onChange={(event) =>
                    set("recipientAddress", event.target.value)
                  }
                  description={
                    serviceMeta.requiresFullAddress
                      ? "Wajib diisi lengkap — barang diantar sampai alamat ini."
                      : "Port to Port diambil sendiri di bandara tujuan, jadi alamat boleh dikosongkan."
                  }
                  error={errors.recipientAddress}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    name="recipientCityInput"
                    label="Kota / kabupaten"
                    required
                    value={values.recipientCity}
                    onChange={(event) =>
                      set("recipientCity", event.target.value)
                    }
                    error={errors.recipientCity}
                  />
                  <TextField
                    name="recipientPostalCodeInput"
                    label="Kode pos"
                    inputMode="numeric"
                    placeholder="Opsional"
                    value={values.recipientPostalCode}
                    onChange={(event) =>
                      set("recipientPostalCode", event.target.value)
                    }
                    error={errors.recipientPostalCode}
                  />
                </div>

                <Field orientation="horizontal">
                  <Checkbox
                    id="saveRecipient"
                    checked={values.saveRecipient}
                    onCheckedChange={(checked) =>
                      set("saveRecipient", checked === true)
                    }
                  />
                  <FieldLabel htmlFor="saveRecipient" className="font-normal">
                    Simpan penerima ini ke buku alamat
                  </FieldLabel>
                </Field>

                <div className="flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft aria-hidden />
                    Kembali
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!stepTwoValid}
                  >
                    Lanjut ke Barang
                    <ArrowRight aria-hidden />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Langkah 3 — Barang */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>3. Isi barang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <TextField
                  name="itemDescriptionInput"
                  label="Deskripsi isi barang"
                  multiline
                  rows={3}
                  required
                  placeholder="Contoh: pakaian dan perlengkapan rumah tangga"
                  value={values.itemDescription}
                  onChange={(event) =>
                    set("itemDescription", event.target.value)
                  }
                  description="Tuliskan sejelas mungkin agar proses di gudang lebih cepat."
                  error={errors.itemDescription}
                />

                <TextField
                  name="declaredValueInput"
                  label="Perkiraan nilai barang (Rp)"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Opsional"
                  value={values.declaredValue}
                  onChange={(event) => set("declaredValue", event.target.value)}
                  description="Dicatat sebagai keterangan, belum termasuk asuransi."
                  error={errors.declaredValue}
                />

                <TextField
                  name="notesInput"
                  label="Catatan untuk tim kami"
                  multiline
                  rows={2}
                  placeholder="Opsional — contoh: mohon dibungkus kayu"
                  value={values.notes}
                  onChange={(event) => set("notes", event.target.value)}
                  error={errors.notes}
                />

                <div className="bg-muted/40 rounded-lg border p-4">
                  <h3 className="text-sm font-medium">
                    Barang yang dilarang dikirim
                  </h3>
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                    {PROHIBITED_ITEMS.map((item) => (
                      <li key={item.title}>{item.title}</li>
                    ))}
                  </ul>
                </div>

                <Field
                  orientation="horizontal"
                  data-invalid={!!errors.prohibitedItemsAgreed}
                >
                  <Checkbox
                    id="prohibitedItemsAgreed"
                    checked={values.prohibitedItemsAgreed}
                    onCheckedChange={(checked) =>
                      set("prohibitedItemsAgreed", checked === true)
                    }
                    aria-describedby="prohibited-error"
                  />
                  <div className="space-y-1">
                    <FieldLabel
                      htmlFor="prohibitedItemsAgreed"
                      className="font-normal"
                    >
                      {PROHIBITED_ITEMS_AGREEMENT}
                    </FieldLabel>
                    {errors.prohibitedItemsAgreed && (
                      <FieldError id="prohibited-error">
                        {errors.prohibitedItemsAgreed}
                      </FieldError>
                    )}
                  </div>
                </Field>

                <div className="flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft aria-hidden />
                    Kembali
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(4)}
                    disabled={!stepThreeValid}
                  >
                    Lanjut ke Ringkasan
                    <ArrowRight aria-hidden />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Langkah 4 — Ringkasan */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>4. Periksa &amp; kirim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ReviewSection
                  title="Layanan"
                  onEdit={() => setStep(1)}
                  rows={[
                    ["Jenis layanan", serviceMeta.label],
                    ["Tujuan", selectedRoute?.destinationName ?? "-"],
                    ["Berat", `${values.declaredWeight} kg`],
                    ["Jumlah koli", values.totalColli],
                  ]}
                />

                <ReviewSection
                  title="Pengirim"
                  rows={[
                    ["Nama", values.senderName],
                    ["Nomor HP", values.senderPhone],
                  ]}
                />

                <ReviewSection
                  title="Penerima"
                  onEdit={() => setStep(2)}
                  rows={[
                    ["Nama", values.recipientName],
                    ["Nomor HP", values.recipientPhone],
                    ["Alamat", values.recipientAddress || "-"],
                    ["Kota", values.recipientCity],
                    ["Kode pos", values.recipientPostalCode || "-"],
                  ]}
                />

                <ReviewSection
                  title="Barang"
                  onEdit={() => setStep(3)}
                  rows={[
                    ["Isi", values.itemDescription],
                    [
                      "Nilai barang",
                      values.declaredValue
                        ? formatRupiah(Number(values.declaredValue))
                        : "-",
                    ],
                    ["Catatan", values.notes || "-"],
                  ]}
                />

                {!values.prohibitedItemsAgreed && (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden />
                    <AlertDescription>
                      Anda belum menyetujui pernyataan barang terlarang pada
                      langkah 3.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                  >
                    <ArrowLeft aria-hidden />
                    Kembali
                  </Button>
                  <SubmitButton pendingText="Membuat booking…">
                    <PackageCheck aria-hidden />
                    Buat Booking
                  </SubmitButton>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>

      <CostSummary
        serviceType={values.serviceType}
        destinationCode={values.destinationCode}
        weight={values.declaredWeight}
      />
    </div>
  )
}

function ReviewSection({
  title,
  rows,
  onEdit,
}: {
  title: string
  rows: [string, string][]
  onEdit?: () => void
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        {onEdit && (
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            Ubah
          </Button>
        )}
      </div>
      <dl className="mt-2 divide-y rounded-lg border">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-2.5 sm:grid-cols-3">
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="text-sm break-words sm:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
