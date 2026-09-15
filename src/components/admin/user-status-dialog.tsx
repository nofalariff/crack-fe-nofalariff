"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, UserCheck } from "lucide-react"
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
import { updateUserStatusAction } from "@/lib/actions/admin"
import type { UserStatus } from "@/types/api"

/**
 * Tangguhkan atau aktifkan kembali akun (FR-ADM-04).
 *
 * Tombol untuk akun admin sendiri memang tidak dirender, dan backend juga
 * menolaknya — supaya admin tidak bisa mengunci dirinya sendiri keluar.
 */
export function UserStatusDialog({
  userId,
  userName,
  currentStatus,
  size = "sm",
}: {
  userId: string
  userName: string
  currentStatus: UserStatus
  size?: "sm" | "default"
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const suspending = currentStatus === "ACTIVE"
  const nextStatus: UserStatus = suspending ? "SUSPENDED" : "ACTIVE"

  async function handleSubmit(formData: FormData) {
    const result = await updateUserStatusAction(undefined, formData)

    if (result?.success) {
      toast.success(result.message ?? "Status akun diperbarui.")
      setOpen(false)
      router.refresh()
      return
    }

    toast.error(result?.message ?? "Gagal mengubah status akun.")
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={suspending ? "outline" : "default"} size={size}>
          {suspending ? <Ban aria-hidden /> : <UserCheck aria-hidden />}
          {suspending ? "Tangguhkan" : "Aktifkan"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={handleSubmit}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="status" value={nextStatus} />

          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspending
                ? `Tangguhkan akun ${userName}?`
                : `Aktifkan kembali akun ${userName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspending
                ? "Pengguna ini tidak akan bisa masuk. Kiriman miliknya tetap ada dan tetap dapat Anda proses seperti biasa."
                : "Pengguna ini akan dapat masuk dan menggunakan akunnya kembali."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button">Batal</AlertDialogCancel>
            <SubmitButton
              variant={suspending ? "destructive" : "default"}
              pendingText="Menyimpan…"
            >
              {suspending ? "Ya, tangguhkan" : "Ya, aktifkan"}
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
