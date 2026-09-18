import { portalLogin } from "@/app/portal/actions"
import { PortalLoginForm } from "./login-form"
import Image from "next/image"
import { ShieldCheck } from "lucide-react"

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
        <div className="text-center space-y-2 flex flex-col items-center">
          <Image
            src="/mainlogo-removebg-preview.webp"
            alt="BaoBao Stay Logo"
            width={96}
            height={96}
            className="h-24 w-24 object-contain mb-2 drop-shadow-xl"
          />
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
