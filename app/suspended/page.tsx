import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlertTriangle, ShieldAlert, PhoneCall, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(auth)/actions"

export const metadata = {
  title: "Tài khoản bị tạm khóa - BaoBao Stay",
}

export default async function SuspendedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch profile and org suspension status
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, org_id, organizations(name, is_suspended, suspension_reason, suspended_at)")
    .eq("id", user.id)
    .single()

  const org = profile?.organizations as unknown as {
    name: string
    is_suspended: boolean
    suspension_reason?: string
    suspended_at?: string
  } | null

  // If not suspended, redirect back to dashboard
  if (!org?.is_suspended) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-slate-900 border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
        <div className="h-2 bg-rose-500 w-full" />
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Tài khoản Tổ chức bị Tạm khóa
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-1">
            Tổ chức <strong className="text-rose-400 font-semibold">{org.name}</strong> hiện tại đã bị ngưng quyền truy cập hệ thống.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6 py-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
              <AlertTriangle className="h-4 w-4" /> Lý do tạm khóa:
            </div>
            <p className="text-slate-300 text-sm italic">
              {org.suspension_reason || "Tổ chức bị khóa do hết hạn gói dịch vụ hoặc vi phạm điều khoản sử dụng."}
            </p>
            {org.suspended_at && (
              <p className="text-slate-500 text-[11px] pt-1">
                Thời gian khóa: {new Date(org.suspended_at).toLocaleString("vi-VN")}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/50 space-y-2 text-xs text-indigo-200">
            <div className="flex items-center gap-2 font-bold text-indigo-300">
              <PhoneCall className="h-4 w-4" /> Hỗ trợ mở lại tài khoản:
            </div>
            <p>
              Nếu bạn là chủ tổ chức và cần kiểm tra lại dịch vụ, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật qua Hotline / Zalo:
            </p>
            <strong className="block text-sm text-white font-mono">0909.123.456 (BaoBao Stay Admin Support)</strong>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-950/60 border-t border-slate-800/80 p-6 flex justify-between items-center">
          <span className="text-xs text-slate-500">Xin lỗi vì sự bất tiện này.</span>
          <form action={logout}>
            <Button type="submit" variant="destructive" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
