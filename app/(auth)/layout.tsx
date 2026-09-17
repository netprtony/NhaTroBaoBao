import Link from "next/link"
import { Building2, Shield, Sparkles, BarChart3 } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side: Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                BaoBao Stay
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>

      {/* Right side: Decorative */}
      <div className="relative hidden w-0 flex-1 lg:block overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex flex-col justify-center items-center text-white p-12">
          {/* Animated background blobs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

          {/* Content */}
          <div className="relative z-10 text-center space-y-8 max-w-md">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Building2 className="h-8 w-8" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight">BaoBao Stay</h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Giải pháp quản lý nhà trọ, căn hộ dịch vụ toàn diện và thông minh.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-3 text-left pt-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Quản lý thu chi & hóa đơn</p>
                  <p className="text-xs text-white/60">Theo dõi doanh thu, điện nước, hoá đơn tự động</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Cổng thông tin khách thuê</p>
                  <p className="text-xs text-white/60">Khách thuê tự xem hóa đơn, hợp đồng online</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">SaaS — Không cần cài đặt</p>
                  <p className="text-xs text-white/60">Sử dụng ngay trên mọi thiết bị, mọi lúc mọi nơi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
