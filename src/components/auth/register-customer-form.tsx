"use client"

import { useActionState } from "react"
import { AlertCircle } from "lucide-react"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerCustomerAction, type ActionState } from "@/lib/auth/actions"

export function RegisterCustomerForm() {
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    registerCustomerAction,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5">
      {state?.message && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <TextField
        name="fullName"
        label="Nama lengkap"
        placeholder="Contoh: Budi Santoso"
        autoComplete="name"
        required
        error={state?.fieldErrors?.fullName}
      />

      <TextField
        name="email"
        type="email"
        label="Email"
        placeholder="nama@email.com"
        autoComplete="email"
        required
        error={state?.fieldErrors?.email}
      />

      <TextField
        name="phone"
        type="tel"
        label="Nomor HP"
        placeholder="0812-3456-7890"
        autoComplete="tel"
        description="Dipakai tim kami untuk menghubungi Anda terkait kiriman."
        required
        error={state?.fieldErrors?.phone}
      />

      <TextField
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        description="Minimal 8 karakter, mengandung huruf dan angka."
        required
        error={state?.fieldErrors?.password}
      />

      <TextField
        name="confirmPassword"
        type="password"
        label="Ulangi password"
        autoComplete="new-password"
        required
        error={state?.fieldErrors?.confirmPassword}
      />

      <SubmitButton className="w-full" pendingText="Mendaftarkan…">
        Daftar
      </SubmitButton>
    </form>
  )
}
