import { portalLogin } from "@/app/portal/actions"
import { PortalLoginForm } from "./login-form"
import { Building2, ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Đăng nhập Cổng Khách thuê - BaoBao Stay",
}

export default async function PortalLoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-2">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">BaoBao Stay</h1>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cổng Thông Tin Khách Thuê
          </div>
        </div>

        {/* Login Card Component */}
        <PortalLoginForm initialError={searchParams.error} action={portalLogin} />

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Nếu chưa có mật khẩu, vui lòng liên hệ Chủ nhà trọ để được cấp tài khoản truy cập.
        </p>
      </div>
    </div>
  )
}
