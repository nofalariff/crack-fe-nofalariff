"use client"

import { useActionState, useEffect } from "react"
import { AlertCircle, Save } from "lucide-react"
import { toast } from "sonner"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FieldLegend, FieldSet } from "@/components/ui/field"
import { updateProfileAction, type ActionState } from "@/lib/auth/actions"
import type { CurrentUser } from "@/types/api"

export function ProfileForm({ user }: { user: CurrentUser }) {
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    updateProfileAction,
    undefined
  )

  useEffect(() => {
    if (state?.success) toast.success(state.message ?? "Profil diperbarui.")
  }, [state])

  const errors = state?.fieldErrors ?? {}
  const profile = user.agentProfile

  return (
    <form action={formAction} className="space-y-8">
      {state?.message && !state.success && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <FieldSet>
        <FieldLegend>Data diri</FieldLegend>

        <TextField
          name="fullName"
          label="Nama lengkap"
          required
          defaultValue={user.fullName}
          error={errors.fullName}
        />

        <TextField
          name="phone"
          label="Nomor HP"
          type="tel"
          required
          defaultValue={user.phone}
          error={errors.phone}
        />

        <TextField
          name="email"
          label="Email"
          type="email"
          defaultValue={user.email}
          readOnly
          disabled
          description="Email tidak dapat diubah sendiri. Hubungi tim LogiSend bila perlu diganti."
        />
      </FieldSet>

      {profile && (
        <FieldSet>
          <FieldLegend>Data perusahaan</FieldLegend>

          <TextField
            name="companyName"
            label="Nama perusahaan"
            defaultValue={profile.companyName}
            error={errors.companyName}
          />
          <TextField
            name="companyAddress"
            label="Alamat perusahaan"
            multiline
            rows={3}
            defaultValue={profile.companyAddress}
            error={errors.companyAddress}
          />
          <TextField
            name="picName"
            label="Nama PIC"
            defaultValue={profile.picName}
            error={errors.picName}
          />
          <TextField
            name="picPhone"
            label="Nomor HP PIC"
            type="tel"
            defaultValue={profile.picPhone}
            error={errors.picPhone}
          />
          <TextField
            name="npwp"
            label="NPWP"
            placeholder="Opsional"
            defaultValue={profile.npwp ?? ""}
            error={errors.npwp}
          />
        </FieldSet>
      )}

      <SubmitButton pendingText="Menyimpan…">
        <Save aria-hidden />
        Simpan Perubahan
      </SubmitButton>
    </form>
  )
}
