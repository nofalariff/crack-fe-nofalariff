import Link from "next/link"
import { ChevronDown, LogOut, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/lib/auth/actions"
import type { CurrentUser } from "@/types/api"

export function UserMenu({ user }: { user: CurrentUser }) {
  const roleLabel =
    user.role === "AGENT"
      ? (user.agentProfile?.companyName ?? "Agen")
      : "Perorangan"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full">
            <UserRound className="size-4" aria-hidden />
          </span>
          <span className="hidden max-w-32 truncate sm:inline">
            {user.fullName}
          </span>
          <ChevronDown className="text-muted-foreground size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="text-muted-foreground truncate text-xs font-normal">
            {user.email}
          </p>
          <p className="text-muted-foreground truncate text-xs font-normal">
            {roleLabel}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profil">
            <UserRound aria-hidden />
            Profil saya
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild variant="destructive">
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut aria-hidden />
              Keluar
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
