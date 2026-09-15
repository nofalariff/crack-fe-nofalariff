"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Tombol submit yang otomatis menonaktifkan diri selama Server Action berjalan.
 * Harus berada di dalam <form> agar useFormStatus mendapat konteksnya.
 */
export function SubmitButton({
  children,
  pendingText,
  className,
  variant,
  size,
}: {
  children: React.ReactNode
  pendingText?: string
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className={className}
      variant={variant}
      size={size}
    >
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending ? (pendingText ?? children) : children}
    </Button>
  )
}
