import type { Metadata } from "next"
import Link from "next/link"
import { Building2 } from "lucide-react"

import { AgentReview } from "@/components/admin/agent-review"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PaginationNav } from "@/components/shared/pagination-nav"
import { Button } from "@/components/ui/button"
import { getAgents } from "@/lib/api/admin"
import type { ApprovalStatus } from "@/types/api"

export const metadata: Metadata = { title: "Agen" }

const TABS: Array<{ value: ApprovalStatus | "ALL"; label: string }> = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "ALL", label: "Semua" },
]

export default async function AdminAgenPage({
  searchParams,
}: PageProps<"/admin/agen">) {
  const params = await searchParams

  const status =
    typeof params.status === "string"
      ? (params.status as ApprovalStatus | "ALL")
      : "PENDING"
  const page = Number(typeof params.page === "string" ? params.page : 1) || 1

  const { data: agents, meta } = await getAgents({
    status: status === "ALL" ? undefined : status,
    page,
    limit: 10,
  })

  return (
    <>
      <PageHeader
        title="Agen"
        description="Pengajuan mitra B2B, yang terlama ditinjau lebih dulu."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = status === tab.value
          return (
            <Button
              key={tab.value}
              asChild
              size="sm"
              variant={active ? "default" : "outline"}
            >
              <Link
                href={`/admin/agen?status=${tab.value}`}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </Link>
            </Button>
          )
        })}
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            status === "PENDING"
              ? "Tidak ada pengajuan menunggu"
              : "Tidak ada data"
          }
          description={
            status === "PENDING"
              ? "Pengajuan agen baru akan otomatis muncul di sini untuk ditinjau."
              : "Belum ada agen dengan status ini."
          }
        />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {meta?.total ?? agents.length} agen pada tab ini.
          </p>

          <ul className="space-y-4">
            {agents.map((agent) => (
              <li key={agent.userId}>
                <AgentReview agent={agent} />
              </li>
            ))}
          </ul>

          <PaginationNav
            page={page}
            totalPages={meta?.totalPages ?? 1}
            basePath="/admin/agen"
            params={params}
          />
        </>
      )}
    </>
  )
}
