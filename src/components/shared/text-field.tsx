"use client"

import { useId, useState } from "react"

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

  /**
   * Field dikendalikan dari state internal, bukan dibiarkan tak-terkontrol.
   *
   * Alasannya konkret: React mengosongkan seluruh input tak-terkontrol setelah
   * sebuah form action selesai. Pada submit yang gagal validasi, itu berarti
   * pengguna kehilangan semua yang sudah diketik dan harus mengisi ulang dari
   * awal — pada form registrasi, seluruh isinya. Nilai yang datang dari state
   * React kebal terhadap reset itu.
   *
   * Pemanggil tetap boleh mengendalikannya sendiri dengan mengirim `value`.
   */
  const { value: controlledValue, defaultValue, onChange, ...rest } = props
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue ?? "")

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    if (!isControlled) setInternalValue(event.target.value)
    onChange?.(event as React.ChangeEvent<HTMLInputElement>)
  }

  const shared = {
    id,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    required,
    value: isControlled ? controlledValue : internalValue,
    onChange: handleChange,
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
          {...(rest as React.ComponentProps<typeof Textarea>)}
          {...shared}
        />
      ) : (
        <Input type={type} {...rest} {...shared} />
      )}

      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}
