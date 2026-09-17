import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export const metadata = {
  title: "Superadmin - BaoBao Stay Platform",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirectTo=/admin/dashboard")
  }

  // Fetch superadmin profile
  const { data: admin } = await supabase
    .from("platform_admins")
    .select("full_name")
    .eq("id", user.id)
    .single()

  if (!admin) {
    redirect("/dashboard")
  }

  const adminName = admin.full_name || user.email || "SuperAdmin"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 z-50">
        <AdminSidebar adminName={adminName} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader adminName={adminName} />
        <main className="flex-1 p-6 bg-slate-950">{children}</main>
      </div>
    </div>
  )
}
