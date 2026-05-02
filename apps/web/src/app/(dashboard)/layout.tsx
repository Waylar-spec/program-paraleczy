import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Topbar } from "@/components/layout/Topbar"
import { Toaster } from "@/components/ui/sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const displayName = user.user_metadata?.full_name ?? user.email ?? "Klinicysta"

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar userName={displayName} />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
