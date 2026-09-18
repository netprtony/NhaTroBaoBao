import Link from "next/link"
import { Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 text-white px-4 text-center">
      <div className="space-y-4 max-w-md">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-200">Trang không tồn tại</h2>
        <p className="text-xs text-slate-400">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="pt-4">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Quay lại Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
