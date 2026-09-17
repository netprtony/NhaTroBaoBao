import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PortalSettingsClient } from "./settings-client"
import { Settings, AlertCircle } from "lucide-react"

export const metadata = {
  title: "Cài đặt tài khoản - Cổng Khách thuê - BaoBao Stay",
}

export default async function PortalSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/portal/login")
  }

  // Fetch tenant info
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, full_name, phone, id_card_number, email")
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (!tenant) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Chưa tìm thấy thông tin khách thuê</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-400" /> Cài đặt & Bảo mật
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Quản lý tên hiển thị và thay đổi mật khẩu đăng nhập Cổng Khách thuê.
        </p>
      </div>

      <PortalSettingsClient tenant={tenant} />
    </div>
  )
}
