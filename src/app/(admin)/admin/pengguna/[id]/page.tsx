import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { StatusDistribution } from "@/components/admin/status-distribution"
import { UserStatusDialog } from "@/components/admin/user-status-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shipment/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminUser } from "@/lib/api/admin"
import { ApiError } from "@/lib/api/errors"
import { requireUser } from "@/lib/auth/dal"
import {
  formatDateShort,
  formatDateTimeWIB,
  formatPhone,
  formatRupiah,
} from "@/lib/format"

export const metadata: Metadata = { title: "Detail Pengguna" }

const ROLE_LABEL = {
  CUSTOMER: "Perorangan",
  AGENT: "Agen",
  ADMIN: "Admin",
} as const

export default async function AdminUserDetailPage({
  params,
}: PageProps<"/admin/pengguna/[id]">) {
  const [{ id }, currentUser] = await Promise.all([
    params,
    requireUser("/admin/pengguna"),
  ])

  const user = await getAdminUser(id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  })

  const isSelf = user.id === currentUser.id

  const account: [string, string][] = [
    ["Email", user.email],
    ["Nomor HP", formatPhone(user.phone)],
    ["Role", ROLE_LABEL[user.role]],
    ["Bergabung", formatDateTimeWIB(user.createdAt)],
  ]

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/admin/pengguna">
          <ArrowLeft aria-hidden />
          Kembali ke daftar pengguna
        </Link>
      </Button>

      <PageHeader
        title={user.fullName}
        description={user.companyName ?? ROLE_LABEL[user.role]}
        action={
          isSelf ? (
            <span className="text-muted-foreground text-sm">
              Ini akun Anda sendiri
            </span>
          ) : (
            <UserStatusDialog
              userId={user.id}
              userName={user.fullName}
              currentStatus={user.status}
              size="default"
            />
          )
        }
      />

      {user.status === "SUSPENDED" && (
        <p className="border-danger/30 bg-danger-soft text-danger-foreground rounded-lg border px-4 py-3 text-sm">
          Akun ini ditangguhkan dan tidak dapat digunakan untuk masuk. Kiriman
          miliknya tetap dapat diproses.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kiriman terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              {user.recentShipments.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Pengguna ini belum pernah membuat kiriman.
                </p>
              ) : (
                <ul className="divide-y">
                  {user.recentShipments.map((shipment) => (
                    <li key={shipment.id}>
                      <Link
                        href={`/admin/kiriman/${shipment.trackingNumber}`}
                        className="hover:bg-muted/50 -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-md px-2 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-medium">
                            {shipment.trackingNumber}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {shipment.destinationName} ·{" "}
                            {formatDateShort(shipment.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={shipment.status} size="sm" />
                          <span className="text-sm font-medium tabular-nums">
                            {formatRupiah(shipment.totalAmount)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {user.agentProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Data perusahaan</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y">
                  {(
                    [
                      ["Nama perusahaan", user.agentProfile.companyName],
                      ["Alamat", user.agentProfile.companyAddress],
                      ["PIC", user.agentProfile.picName],
                      ["HP PIC", formatPhone(user.agentProfile.picPhone)],
                      ["NPWP", user.agentProfile.npwp ?? "Tidak diisi"],
                      [
                        "Status pengajuan",
                        user.agentProfile.approvalStatus === "APPROVED"
                          ? "Disetujui"
                          : user.agentProfile.approvalStatus === "REJECTED"
                            ? "Ditolak"
                            : "Menunggu",
                      ],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-3"
                    >
                      <dt className="text-muted-foreground text-sm">{label}</dt>
                      <dd className="text-sm sm:col-span-2">{value}</dd>
                    </div>
                  ))}
                </dl>

                {user.agentProfile.rejectionReason && (
                  <p className="border-danger/30 bg-danger-soft text-danger-foreground mt-4 rounded-lg border px-3 py-2 text-sm">
                    Alasan penolakan: {user.agentProfile.rejectionReason}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total kiriman</span>
                <span className="font-medium tabular-nums">
                  {user.shipmentCount}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Nilai terbayar</span>
                <span className="font-medium">
                  {formatRupiah(user.totalSpent)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Akun</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {account.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {user.shipmentCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sebaran status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusDistribution counts={user.statusCounts} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
