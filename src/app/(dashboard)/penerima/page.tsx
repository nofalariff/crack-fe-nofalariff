import type { Metadata } from "next"
import { Pencil, Users } from "lucide-react"

import { DeleteRecipientDialog } from "@/components/recipient/delete-recipient-dialog"
import { RecipientDialog } from "@/components/recipient/recipient-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getRecipients } from "@/lib/api/endpoints"
import { formatPhone } from "@/lib/format"

export const metadata: Metadata = { title: "Buku Alamat Penerima" }

export default async function PenerimaPage() {
  const recipients = await getRecipients()

  return (
    <>
      <PageHeader
        title="Penerima"
        description="Simpan data penerima yang sering Anda kirimi agar booking berikutnya lebih cepat."
        action={<RecipientDialog />}
      />

      {recipients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Buku alamat masih kosong"
          description="Tambahkan penerima yang sering Anda kirimi. Saat booking, cukup pilih namanya dan seluruh kolom terisi otomatis."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {recipients.map((recipient) => (
            <li key={recipient.id}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {recipient.label && (
                        <p className="text-primary text-xs font-medium">
                          {recipient.label}
                        </p>
                      )}
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {formatPhone(recipient.phone)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <RecipientDialog
                        recipient={recipient}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil aria-hidden />
                            <span className="sr-only">
                              Ubah {recipient.name}
                            </span>
                          </Button>
                        }
                      />
                      <DeleteRecipientDialog
                        recipientId={recipient.id}
                        recipientName={recipient.name}
                      />
                    </div>
                  </div>

                  <address className="text-muted-foreground mt-3 text-sm not-italic">
                    {recipient.address}
                    <br />
                    {recipient.city}
                    {recipient.postalCode ? ` ${recipient.postalCode}` : ""}
                  </address>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
