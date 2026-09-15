import Link from "next/link"
import { Building2 } from "lucide-react"

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
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Building2 className="h-6 w-6 text-primary" />
              <span>BaoBao Stay</span>
            </Link>
          </div>
          {children}
        </div>
      </div>

      {/* Right side: Decorative */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary flex flex-col justify-center items-center text-white p-12">
          <h1 className="text-4xl font-bold mb-4">BaoBao Stay</h1>
          <p className="text-xl text-center max-w-md text-white/90">
            Giải pháp quản lý nhà trọ, căn hộ dịch vụ toàn diện và thông minh.
          </p>
        </div>
      </div>
    </div>
  )
}
