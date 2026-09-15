"use client"

import { useActionState } from "react"
import { AlertCircle, Info } from "lucide-react"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FieldLegend, FieldSet } from "@/components/ui/field"
import { registerAgentAction, type ActionState } from "@/lib/auth/actions"

export function RegisterAgentForm() {
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    registerAgentAction,
    undefined
  )

  const errors = state?.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-8">
      {state?.message && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info aria-hidden />
        <AlertTitle>Perlu persetujuan admin</AlertTitle>
        <AlertDescription>
          Akun agen dapat langsung digunakan untuk masuk, namun pembuatan
          booking baru terbuka setelah data perusahaan Anda disetujui tim
          LogiSend.
        </AlertDescription>
      </Alert>

      <FieldSet>
        <FieldLegend>Data akun</FieldLegend>

        <TextField
          name="fullName"
          label="Nama lengkap"
          autoComplete="name"
          required
          error={errors.fullName}
        />
        <TextField
          name="email"
          type="email"
          label="Email"
          placeholder="nama@perusahaan.com"
          autoComplete="email"
          required
          error={errors.email}
        />
        <TextField
          name="phone"
          type="tel"
          label="Nomor HP"
          placeholder="0812-3456-7890"
          autoComplete="tel"
          required
          error={errors.phone}
        />
        <TextField
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          description="Minimal 8 karakter, mengandung huruf dan angka."
          required
          error={errors.password}
        />
        <TextField
          name="confirmPassword"
          type="password"
          label="Ulangi password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend>Data perusahaan</FieldLegend>

        <TextField
          name="companyName"
          label="Nama perusahaan"
          placeholder="Contoh: CV Rahayu Logistik"
          autoComplete="organization"
          required
          error={errors.companyName}
        />
        <TextField
          name="companyAddress"
          label="Alamat perusahaan"
          multiline
          rows={3}
          placeholder="Jalan, nomor, kelurahan, kecamatan, kota"
          required
          error={errors.companyAddress}
        />
        <TextField
          name="npwp"
          label="NPWP"
          placeholder="Opsional"
          description="Boleh dikosongkan bila belum tersedia."
          error={errors.npwp}
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend>Penanggung jawab (PIC)</FieldLegend>

        <TextField
          name="picName"
          label="Nama PIC"
          required
          error={errors.picName}
        />
        <TextField
          name="picPhone"
          type="tel"
          label="Nomor HP PIC"
          placeholder="0812-3456-7890"
          required
          error={errors.picPhone}
        />
      </FieldSet>

      <SubmitButton className="w-full" pendingText="Mengirim pengajuan…">
        Ajukan Pendaftaran Agen
      </SubmitButton>
    </form>
  )
}
