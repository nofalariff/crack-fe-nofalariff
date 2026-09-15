import type { Metadata } from "next"
import Link from "next/link"
import { Users } from "lucide-react"

import { UserFilters } from "@/components/admin/user-filters"
import { UserStatusDialog } from "@/components/admin/user-status-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PaginationNav } from "@/components/shared/pagination-nav"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAdminUsers } from "@/lib/api/admin"
import { requireUser } from "@/lib/auth/dal"
import { formatDateShort, formatPhone } from "@/lib/format"
import type { UserRole, UserStatus } from "@/types/api"

export const metadata: Metadata = { title: "Pengguna" }

const ROLE_LABEL: Record<UserRole, string> = {
  CUSTOMER: "Perorangan",
  AGENT: "Agen",
  ADMIN: "Admin",
}

export default async function AdminPenggunaPage({
  searchParams,
}: PageProps<"/admin/pengguna">) {
  const [currentUser, params] = await Promise.all([
    requireUser("/admin/pengguna"),
    searchParams,
  ])

  const readParam = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined

  const page = Number(readParam("page") ?? 1) || 1

  const { data: users, meta } = await getAdminUsers({
    role: readParam("role") as UserRole | undefined,
    status: readParam("status") as UserStatus | undefined,
    search: readParam("search"),
    page,
    limit: 20,
  })

  const hasFilter = ["role", "status", "search"].some((key) => readParam(key))

  return (
    <>
      <PageHeader
        title="Pengguna"
        description={
          meta
            ? `${meta.total} akun cocok dengan filter saat ini.`
            : "Seluruh akun LogiSend."
        }
      />

      <UserFilters />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak ada pengguna yang cocok"
          description={
            hasFilter
              ? "Longgarkan atau hapus filter untuk melihat akun lainnya."
              : "Belum ada akun terdaftar."
          }
          action={
            hasFilter
              ? { label: "Hapus filter", href: "/admin/pengguna" }
              : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Kiriman</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Bergabung</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === currentUser.id

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Link
                          href={`/admin/pengguna/${user.id}`}
                          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                        >
                          {user.fullName}
                        </Link>
                        {user.companyName && (
                          <p className="text-muted-foreground text-xs">
                            {user.companyName}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <p className="text-sm">{user.email}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatPhone(user.phone)}
                        </p>
                      </TableCell>

                      <TableCell className="text-sm">
                        {ROLE_LABEL[user.role]}
                        {user.approvalStatus &&
                          user.approvalStatus !== "APPROVED" && (
                            <p className="text-warning-foreground text-xs">
                              {user.approvalStatus === "PENDING"
                                ? "Menunggu approval"
                                : "Ditolak"}
                            </p>
                          )}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {user.shipmentCount}
                      </TableCell>

                      <TableCell>
                        <span
                          className={
                            user.status === "ACTIVE"
                              ? "bg-success-soft text-success-foreground border-success/25 rounded-full border px-2 py-0.5 text-xs font-medium"
                              : "bg-danger-soft text-danger-foreground border-danger/25 rounded-full border px-2 py-0.5 text-xs font-medium"
                          }
                        >
                          {user.status === "ACTIVE" ? "Aktif" : "Ditangguhkan"}
                        </span>
                      </TableCell>

                      <TableCell className="text-muted-foreground text-right text-xs whitespace-nowrap">
                        {formatDateShort(user.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        {isSelf ? (
                          <span className="text-muted-foreground text-xs">
                            Akun Anda
                          </span>
                        ) : (
                          <UserStatusDialog
                            userId={user.id}
                            userName={user.fullName}
                            currentStatus={user.status}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <PaginationNav
            page={page}
            totalPages={meta?.totalPages ?? 1}
            basePath="/admin/pengguna"
            params={params}
          />
        </>
      )}
    </>
  )
}
