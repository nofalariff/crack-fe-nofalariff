"use client"

import { useActionState } from "react"
import { AlertCircle, Info, KeyRound } from "lucide-react"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { changePasswordAction, type ActionState } from "@/lib/auth/actions"

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    changePasswordAction,
    undefined
  )

  const errors = state?.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-5">
      {state?.message && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info aria-hidden />
        <AlertDescription>
          Demi keamanan, mengganti password akan mengakhiri seluruh sesi Anda.
          Anda perlu masuk kembali dengan password baru.
        </AlertDescription>
      </Alert>

      <TextField
        name="currentPassword"
        label="Password lama"
        type="password"
        autoComplete="current-password"
        required
        error={errors.currentPassword}
      />

      <TextField
        name="newPassword"
        label="Password baru"
        type="password"
        autoComplete="new-password"
        required
        description="Minimal 8 karakter, mengandung huruf dan angka."
        error={errors.newPassword}
      />

      <TextField
        name="confirmPassword"
        label="Ulangi password baru"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirmPassword}
      />

      <SubmitButton pendingText="Memperbarui…">
        <KeyRound aria-hidden />
        Ganti Password
      </SubmitButton>
    </form>
  )
}
