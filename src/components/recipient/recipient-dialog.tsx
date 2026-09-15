"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"

import { SubmitButton } from "@/components/shared/submit-button"
import { TextField } from "@/components/shared/text-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  saveRecipientAction,
  type RecipientActionState,
} from "@/lib/actions/recipients"
import type { Recipient } from "@/types/api"

export function RecipientDialog({
  recipient,
  trigger,
}: {
  recipient?: Recipient
  trigger?: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<RecipientActionState>()

  // Sukses berarti menutup dialog dan menyegarkan daftar; kegagalan berarti
  // menahan dialog tetap terbuka beserta pesan error per kolomnya. Keduanya
  // reaksi terhadap submit, jadi ditangani langsung di form action.
  async function handleSubmit(formData: FormData) {
    const result = await saveRecipientAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Tersimpan.")
      setState(undefined)
      setOpen(false)
      router.refresh()
      return
    }

    setState(result)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // Bersihkan sisa error saat dialog ditutup lalu dibuka lagi.
    if (!next) setState(undefined)
  }

  const errors = state?.fieldErrors ?? {}
  const isEdit = Boolean(recipient)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus aria-hidden />
            Tambah Penerima
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form action={handleSubmit} className="space-y-5">
          {recipient && (
            <input type="hidden" name="recipientId" value={recipient.id} />
          )}

          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Ubah Penerima" : "Tambah Penerima"}
            </DialogTitle>
            <DialogDescription>
              Data ini hanya tersimpan di buku alamat Anda dan bisa dipakai
              ulang saat membuat booking.
            </DialogDescription>
          </DialogHeader>

          {state?.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <TextField
            name="label"
            label="Label"
            placeholder="Opsional — contoh: Rumah Ibu"
            defaultValue={recipient?.label ?? ""}
            description="Memudahkan Anda mengenali penerima ini di daftar."
            error={errors.label}
          />

          <TextField
            name="name"
            label="Nama penerima"
            required
            defaultValue={recipient?.name ?? ""}
            error={errors.name}
          />

          <TextField
            name="phone"
            label="Nomor HP"
            type="tel"
            placeholder="0812-3456-7890"
            required
            defaultValue={recipient?.phone ?? ""}
            error={errors.phone}
          />

          <TextField
            name="address"
            label="Alamat"
            multiline
            rows={3}
            required
            defaultValue={recipient?.address ?? ""}
            error={errors.address}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="city"
              label="Kota / kabupaten"
              required
              defaultValue={recipient?.city ?? ""}
              error={errors.city}
            />
            <TextField
              name="postalCode"
              label="Kode pos"
              placeholder="Opsional"
              defaultValue={recipient?.postalCode ?? ""}
              error={errors.postalCode}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <SubmitButton pendingText="Menyimpan…">
              {isEdit ? "Simpan Perubahan" : "Simpan Penerima"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
