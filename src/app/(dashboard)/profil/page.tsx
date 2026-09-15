import type { Metadata } from "next"
import Link from "next/link"

import { ChangePasswordForm } from "@/components/profile/change-password-form"
import { ProfileForm } from "@/components/profile/profile-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Profil" }

export default async function ProfilPage() {
  const user = await requireUser("/profil")

  return (
    <>
      <PageHeader
        title="Profil"
        description="Kelola data diri dan keamanan akun Anda."
        action={
          user.role === "AGENT" ? (
            <Button asChild variant="outline">
              <Link href="/status-pengajuan">Status pengajuan agen</Link>
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Data Profil</TabsTrigger>
          <TabsTrigger value="keamanan">Keamanan</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keamanan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ganti Password</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
