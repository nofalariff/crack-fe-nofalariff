"use client"

import { useActionState } from "react"
import { AlertCircle } from "lucide-react"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginAction, type ActionState } from "@/lib/auth/actions"

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    loginAction,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}

      {state?.message && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

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
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        error={state?.fieldErrors?.password}
      />

      <SubmitButton className="w-full" pendingText="Memproses…">
        Masuk
      </SubmitButton>
    </form>
  )
}
