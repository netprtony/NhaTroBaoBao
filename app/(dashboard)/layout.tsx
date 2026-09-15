import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      organizations (*)
    `)
    .eq("id", user.id)
    .single()
    
  // Support both single organization and array of organizations depending on the relation
  const orgData = Array.isArray(profile?.organizations) 
    ? profile?.organizations[0] 
    : profile?.organizations

  const orgName = orgData?.name || "Cơ sở kinh doanh"
  const userName = profile?.full_name || user.email || "Người dùng"
  const userRole = profile?.role || "Admin"

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <Sidebar orgName={orgName} userName={userName} userRole={userRole} />
      </aside>
      <div className="lg:pl-64">
        <Header orgName={orgName} userName={userName} userRole={userRole} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
