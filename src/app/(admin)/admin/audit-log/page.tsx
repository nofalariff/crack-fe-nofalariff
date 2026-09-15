import type { Metadata } from "next"
import { ArrowRight, ScrollText } from "lucide-react"

import { AuditFilters } from "@/components/admin/audit-filters"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PaginationNav } from "@/components/shared/pagination-nav"
import { Card, CardContent } from "@/components/ui/card"
import { getAuditLogs } from "@/lib/api/admin"
import { AUDIT_ACTION_LABEL, auditFieldLabel } from "@/lib/constants/audit"
import { formatDateTimeWIB } from "@/lib/format"
import type { AuditAction, AuditLogEntry } from "@/types/api"

export const metadata: Metadata = { title: "Audit Log" }

export default async function AdminAuditLogPage({
  searchParams,
}: PageProps<"/admin/audit-log">) {
  const params = await searchParams

  const readParam = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined

  const page = Number(readParam("page") ?? 1) || 1

  const { data: logs, meta } = await getAuditLogs({
    action: readParam("action") as AuditAction | undefined,
    dateFrom: readParam("dateFrom"),
    dateTo: readParam("dateTo"),
    page,
    limit: 30,
  })

  const hasFilter = ["action", "dateFrom", "dateTo"].some((key) =>
    readParam(key)
  )

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Riwayat aksi sensitif beserta pelaku dan nilai sebelum–sesudahnya."
      />

      <AuditFilters />

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={
            hasFilter ? "Tidak ada catatan yang cocok" : "Belum ada catatan"
          }
          description={
            hasFilter
              ? "Longgarkan atau hapus filter untuk melihat catatan lainnya."
              : "Setiap perubahan status, verifikasi pembayaran, approval agen, dan perubahan tarif akan tercatat di sini secara otomatis."
          }
          action={
            hasFilter
              ? { label: "Hapus filter", href: "/admin/audit-log" }
              : undefined
          }
        />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {meta?.total ?? logs.length} catatan.
          </p>

          <ul className="space-y-3">
            {logs.map((log) => (
              <li key={log.id}>
                <AuditRow log={log} />
              </li>
            ))}
          </ul>

          <PaginationNav
            page={page}
            totalPages={meta?.totalPages ?? 1}
            basePath="/admin/audit-log"
            params={params}
          />
        </>
      )}
    </>
  )
}

function AuditRow({ log }: { log: AuditLogEntry }) {
  // Gabungkan kunci sebelum & sesudah agar perubahan terbaca berpasangan.
  const keys = Array.from(
    new Set([...Object.keys(log.before ?? {}), ...Object.keys(log.after ?? {})])
  )

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {AUDIT_ACTION_LABEL[log.action] ?? log.action}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {log.entityType} ·{" "}
              <span className="font-mono">{log.entityLabel}</span>
            </p>
          </div>

          <div className="text-right text-xs">
            <p className="font-medium">{log.actorName}</p>
            <p className="text-muted-foreground">
              {formatDateTimeWIB(log.createdAt)}
            </p>
          </div>
        </div>

        {keys.length > 0 && (
          <ul className="space-y-1 border-t pt-3">
            {keys.map((key) => {
              const before = log.before?.[key]
              const after = log.after?.[key]

              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <span className="text-muted-foreground w-36 shrink-0 text-xs">
                    {auditFieldLabel(key)}
                  </span>

                  {before !== undefined && before !== null && (
                    <>
                      <span className="text-muted-foreground line-through">
                        {String(before)}
                      </span>
                      <ArrowRight
                        className="text-muted-foreground size-3.5"
                        aria-label="menjadi"
                      />
                    </>
                  )}

                  <span className="font-medium break-words">
                    {after === undefined || after === null
                      ? "—"
                      : String(after)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
