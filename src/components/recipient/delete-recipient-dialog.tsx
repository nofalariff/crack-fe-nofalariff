"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { SubmitButton } from "@/components/shared/submit-button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  deleteRecipientAction,
  type RecipientActionState,
} from "@/lib/actions/recipients"

export function DeleteRecipientDialog({
  recipientId,
  recipientName,
}: {
  recipientId: string
  recipientName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Menutup dialog adalah reaksi terhadap kejadian submit, bukan sinkronisasi
  // state — jadi ditangani langsung di form action, bukan lewat effect.
  async function handleSubmit(formData: FormData) {
    const result: RecipientActionState | undefined =
      await deleteRecipientAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Penerima dihapus.")
      setOpen(false)
      router.refresh()
      return
    }

    if (result?.message) toast.error(result.message)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 aria-hidden />
          <span className="sr-only">Hapus {recipientName}</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={handleSubmit}>
          <input type="hidden" name="recipientId" value={recipientId} />

          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {recipientName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Penerima ini akan dihapus dari buku alamat Anda. Kiriman yang
              sudah dibuat sebelumnya tidak terpengaruh — data penerimanya sudah
              tersimpan pada kiriman tersebut.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button">Batal</AlertDialogCancel>
            <SubmitButton variant="destructive" pendingText="Menghapus…">
              Ya, hapus
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
