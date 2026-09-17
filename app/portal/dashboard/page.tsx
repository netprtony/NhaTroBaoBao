import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, FileText, Receipt, Zap, AlertCircle, CheckCircle2, Clock, ArrowRight, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Tổng quan - Cổng Khách thuê - BaoBao Stay",
}

export default async function PortalDashboardPage() {
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
    .select("*, organizations(name, phone, address)")
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (!tenant) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Chưa tìm thấy thông tin khách thuê</h2>
        <p className="text-sm text-slate-400 mt-1">
          Hồ sơ của bạn chưa được liên kết với phòng thuê nào. Vui lòng liên hệ chủ trọ để hỗ trợ.
        </p>
      </div>
    )
  }

  // Fetch active lease with room & property
  const { data: lease } = await supabase
    .from("leases")
    .select("*, room:rooms(*, property:properties(*))")
    .eq("tenant_id", tenant.id)
    .eq("status", "active")
    .maybeSingle()

  // Fetch recent invoices
  let invoices: Array<{
    id: string
    period: string
    total_amount: number
    status: string
    due_date: string
  }> = []

  if (lease) {
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("id, period, total_amount, status, due_date")
      .eq("lease_id", lease.id)
      .order("period", { ascending: false })
      .limit(3)

    if (invoiceData) {
      invoices = invoiceData
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  const room = lease?.room
  const property = room?.property
  const latestInvoice = invoices[0]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-900/40 border border-blue-500/20 p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 mb-2">
              <Shield className="h-3.5 w-3.5" /> Khách thuê phòng
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Xin chào, {tenant.full_name}!</h1>
            <p className="text-sm text-slate-300 mt-1">
              {room ? `Bạn đang thuê phòng P.${room.room_code} tại ${property?.name || "Khu trọ"}` : "Chào mừng bạn đến với Cổng thông tin khách thuê BaoBao Stay"}
            </p>
          </div>
          {latestInvoice && latestInvoice.status === "unpaid" && (
            <Link href="/portal/invoices">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 gap-2">
                <Receipt className="h-4 w-4" />
                Thanh toán hóa đơn kỳ {latestInvoice.period}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Room Info */}
        <Card className="bg-slate-900/70 border-slate-800 backdrop-blur-sm text-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Thông tin phòng</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Home className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-xl text-white">
              {room ? `Phòng ${room.room_code}` : "Chưa có phòng"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs truncate">
              {property?.name || "Tên nhà trọ"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {room ? (
              <>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Địa chỉ:</span>
                  <span className="font-medium text-slate-200 text-right max-w-[180px] truncate">{property?.address || "---"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Diện tích:</span>
                  <span className="font-medium text-slate-200">{room.area ? `${room.area} m²` : "---"}</span>
                </div>
                <div className="flex justify-between py-1.5 text-xs">
                  <span className="text-slate-400">Giá thuê niêm yết:</span>
                  <span className="font-semibold text-emerald-400">{formatVND(room.base_price)}/tháng</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">Hiện không có thông tin phòng trọ active.</p>
            )}
          </CardContent>
        </Card>

        {/* Active Contract Info */}
        <Card className="bg-slate-900/70 border-slate-800 backdrop-blur-sm text-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Hợp đồng thuê</span>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-xl text-white">
              {lease ? formatVND(lease.monthly_rent) : "Chưa có HĐ"}
              {lease && <span className="text-xs font-normal text-slate-400">/tháng</span>}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              {lease ? `Bắt đầu: ${new Date(lease.start_date).toLocaleDateString("vi-VN")}` : "Hợp đồng thuê phòng"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lease ? (
              <>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Tiền đặt cọc:</span>
                  <span className="font-medium text-amber-400">{formatVND(lease.deposit)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Thời hạn hợp đồng:</span>
                  <span className="font-medium text-slate-200">
                    {lease.end_date ? new Date(lease.end_date).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                  </span>
                </div>
                <div className="pt-1">
                  <Link href="/portal/contract">
                    <Button variant="outline" size="sm" className="w-full text-xs border-slate-700 hover:bg-slate-800 text-slate-300">
                      Xem chi tiết hợp đồng <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">Không tìm thấy hợp đồng hoạt động.</p>
            )}
          </CardContent>
        </Card>

        {/* Latest Invoice Status */}
        <Card className="bg-slate-900/70 border-slate-800 backdrop-blur-sm text-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Hóa đơn gần nhất</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-xl text-white">
              {latestInvoice ? formatVND(latestInvoice.total_amount) : "0 đ"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              {latestInvoice ? `Kỳ thanh toán: ${latestInvoice.period}` : "Chưa có hóa đơn"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {latestInvoice ? (
              <>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Trạng thái:</span>
                  {latestInvoice.status === "paid" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Đã thanh toán
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
                      <Clock className="h-3 w-3" /> Chưa thanh toán
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Hạn thanh toán:</span>
                  <span className="font-medium text-slate-200">
                    {new Date(latestInvoice.due_date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="pt-1">
                  <Link href="/portal/invoices">
                    <Button size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium">
                      Xem tất cả hóa đơn <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">Chưa phát sinh hóa đơn tiền phòng.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/portal/invoices">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Hóa đơn tiền phòng</p>
              <p className="text-xs text-slate-400">Xem phiếu & quét QR</p>
            </div>
          </div>
        </Link>

        <Link href="/portal/meter-readings">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Chỉ số Điện / Nước</p>
              <p className="text-xs text-slate-400">Theo dõi tiêu thụ</p>
            </div>
          </div>
        </Link>

        <Link href="/portal/contract">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Hợp đồng thuê</p>
              <p className="text-xs text-slate-400">Xem điều khoản</p>
            </div>
          </div>
        </Link>

        <Link href="/portal/settings">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Tài khoản & Đổi MK</p>
              <p className="text-xs text-slate-400">Bảo mật tài khoản</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
