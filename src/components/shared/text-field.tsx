"use client"

import { useId } from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/**
 * Input teks dengan label, deskripsi, dan pesan error yang sudah terkait
 * secara aksesibel (NFR-UX-04): setiap input punya <label> dan pesan error
 * dirujuk lewat aria-describedby.
 */
export function TextField({
  name,
  label,
  description,
  error,
  type = "text",
  multiline = false,
  required,
  ...props
}: {
  name: string
  label: string
  description?: string
  error?: string
  /** Render sebagai <textarea>; `rows` ikut diteruskan. */
  multiline?: boolean
  rows?: number
  type?: React.HTMLInputTypeAttribute
} & Omit<React.ComponentProps<"input">, "name" | "type">) {
  const reactId = useId()
  const id = props.id ?? `${name}-${reactId}`
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  const shared = {
    id,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    required,
  }

  return (
    <Field data-invalid={!!error}>
      {/* Penanda wajib dirender lewat CSS, bukan sebagai teks di dalam label:
          teks label harus tetap persis nama field-nya agar pembaca layar dan
          pencarian berbasis label tidak membaca "Password*". Status wajib
          sendiri sudah disampaikan atribut `required` pada input. */}
      <FieldLabel
        htmlFor={id}
        className={cn(
          required && "after:text-destructive after:-ml-1 after:content-['*']"
        )}
      >
        {label}
      </FieldLabel>

      {multiline ? (
        <Textarea
          {...shared}
          {...(props as React.ComponentProps<typeof Textarea>)}
        />
      ) : (
        <Input type={type} {...shared} {...props} />
      )}

      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}
