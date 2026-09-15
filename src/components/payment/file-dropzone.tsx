"use client"

import { useRef, useState } from "react"
import { FileText, ImageIcon, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { SHIPMENT_LIMITS } from "@/lib/constants/service-type"
import { cn } from "@/lib/utils"

/**
 * Pemilih berkas bukti transfer.
 *
 * Validasi di sini murni untuk kenyamanan pengguna — backend tetap memeriksa
 * ukuran dan tipe berkas berdasarkan isinya, bukan ekstensi (NFR-SEC-06).
 */
export function FileDropzone({
  name,
  label,
  error,
}: {
  name: string
  label: string
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const maxMb = Math.round(SHIPMENT_LIMITS.maxUploadBytes / (1024 * 1024))

  function applyFile(nextFile: File | null) {
    setLocalError(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)

    if (!nextFile) {
      setFile(null)
      return
    }

    if (nextFile.size > SHIPMENT_LIMITS.maxUploadBytes) {
      setLocalError(`Ukuran berkas melebihi ${maxMb} MB.`)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    if (!SHIPMENT_LIMITS.acceptedUploadTypes.includes(nextFile.type)) {
      setLocalError(
        "Format berkas tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF."
      )
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setFile(nextFile)
    if (nextFile.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(nextFile))
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    const dropped = event.dataTransfer.files?.[0]
    if (!dropped) return

    // Input tetap jadi sumber nilai form; DataTransfer disalin ke sana.
    const transfer = new DataTransfer()
    transfer.items.add(dropped)
    if (inputRef.current) inputRef.current.files = transfer.files

    applyFile(dropped)
  }

  const message = localError ?? error

  return (
    <Field data-invalid={!!message}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg border border-dashed p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border"
        )}
      >
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="file"
          accept={SHIPMENT_LIMITS.acceptedUploadTypes.join(",")}
          className="sr-only"
          aria-describedby={`${name}-description`}
          onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Pratinjau bukti transfer"
                className="size-20 rounded-md border object-cover"
              />
            ) : (
              <span className="bg-muted text-muted-foreground flex size-20 items-center justify-center rounded-md border">
                <FileText className="size-8" aria-hidden />
              </span>
            )}

            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-muted-foreground text-xs">
                {(file.size / 1024).toFixed(0)} KB
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2"
                onClick={() => {
                  applyFile(null)
                  if (inputRef.current) inputRef.current.value = ""
                }}
              >
                <X aria-hidden />
                Ganti berkas
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="bg-muted text-muted-foreground mx-auto flex size-10 items-center justify-center rounded-full">
              <ImageIcon className="size-5" aria-hidden />
            </span>
            <p className="text-muted-foreground text-sm">
              Tarik berkas ke sini, atau
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden />
              Pilih berkas
            </Button>
          </div>
        )}
      </div>

      <FieldDescription id={`${name}-description`}>
        Format JPG, PNG, WEBP, atau PDF. Maksimal {maxMb} MB.
      </FieldDescription>

      {message && <FieldError>{message}</FieldError>}
    </Field>
  )
}
