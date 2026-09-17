import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  CheckCircle,
  Receipt,
  TrendingUp,
  Clock,
  ArrowRight,
  Gauge,
  Plus,
  FileText,
  AlertTriangle,
  Phone,
  CheckCircle2,
  Wallet,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

import { getOrgPlanUsage } from "@/lib/subscription/check-limit"
import { PlanLimitBanner } from "@/components/dashboard/plan-limit-banner"

export const metadata = { title: "Tổng quan - BaoBao Stay" }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Lấy thông tin tổ chức của user
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, full_name, organizations(name)")
    .eq("id", user.id)
    .single()

  const orgId = profile?.org_id
  if (!orgId) {
    redirect("/login")
  }

  // Lấy thông tin hạn mức gói đăng ký
  const planUsage = await getOrgPlanUsage(orgId)

  const orgData = Array.isArray(profile?.organizations)
    ? profile?.organizations[0]
    : profile?.organizations
  const orgName = orgData?.name || "Cơ sở kinh doanh"

  // 1. Fetch danh sách nhà trọ và phòng của tổ chức
  const { data: propertiesData } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      address,
      created_at,
      rooms (
        id,
        room_code,
        status,
        base_price
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  const properties = propertiesData || []
  const totalProperties = properties.length

  // Thống kê phòng
  const allRooms = properties.flatMap((p) => p.rooms || [])
  const totalRooms = allRooms.length
  const availableRooms = allRooms.filter((r) => r.status === "available").length
  const occupiedRooms = allRooms.filter((r) => r.status === "occupied").length
  const maintenanceRooms = allRooms.filter((r) => r.status === "maintenance").length
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  // 2. Fetch danh sách hợp đồng active & kiểm tra hợp đồng sắp hết hạn trong 30 ngày
  const { data: leasesData } = await supabase
    .from("leases")
    .select(`
      id,
      room_id,
      tenant_id,
      start_date,
      end_date,
      monthly_rent,
      status,
      room:rooms (
        room_code,
        property:properties (name)
      ),
      tenant:tenants (
        full_name,
        phone
      )
    `)
    .eq("org_id", orgId)
    .eq("status", "active")
    .order("end_date", { ascending: true })

  const activeLeases = (leasesData || []) as Array<{
    id: string
    room_id: string
    tenant_id: string
    start_date: string
    end_date: string
    monthly_rent: number
    status: string
    room: { room_code: string; property: { name: string } | null } | null
    tenant: { full_name: string; phone: string } | null
  }>

  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const in30Days = new Date()
  in30Days.setDate(today.getDate() + 30)
  const in30DaysStr = in30Days.toISOString().split("T")[0]

  // Hợp đồng sắp hết hạn trong 30 ngày
  const expiringLeases = activeLeases.filter((l) => {
    return l.end_date >= todayStr && l.end_date <= in30DaysStr
  })

  // 3. Fetch danh sách khách thuê
  const { count: tenantsCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)

  const totalTenants = tenantsCount || 0

  // 4. Fetch danh sách hóa đơn & tài chính
  const { data: invoicesData } = await supabase
    .from("invoices")
    .select(`
      id,
      period,
      total_amount,
      rent_amount,
      electricity_amount,
      water_amount,
      other_fees,
      status,
      due_date,
      created_at,
      lease:leases (
        room:rooms (
          room_code,
          property:properties (name)
        ),
        tenant:tenants (
          full_name,
          phone
        )
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  const allInvoices = (invoicesData || []) as Array<{
    id: string
    period: string
    total_amount: number
    rent_amount: number
    electricity_amount: number
    water_amount: number
    other_fees: number
    status: string
    due_date: string
    created_at: string
    lease: {
      room: { room_code: string; property: { name: string } | null } | null
      tenant: { full_name: string; phone: string } | null
    } | null
  }>

  const paidInvoices = allInvoices.filter((inv) => inv.status === "paid")
  const pendingInvoices = allInvoices.filter((inv) => inv.status === "pending")

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
  const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  // Cơ cấu doanh thu thực thu
  const rentRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.rent_amount || 0), 0)
  const elecRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.electricity_amount || 0), 0)
  const waterRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.water_amount || 0), 0)
  const otherRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.other_fees || 0), 0)

  const rentPercent = totalRevenue > 0 ? Math.round((rentRevenue / totalRevenue) * 100) : 0
  const elecPercent = totalRevenue > 0 ? Math.round((elecRevenue / totalRevenue) * 100) : 0
  const waterPercent = totalRevenue > 0 ? Math.round((waterRevenue / totalRevenue) * 100) : 0
  const otherPercent = totalRevenue > 0 ? Math.max(0, 100 - rentPercent - elecPercent - waterPercent) : 0

  // 5 hóa đơn cần thu gần nhất
  const topPendingInvoices = pendingInvoices.slice(0, 5)

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  // Định dạng ngày tiếng Việt
  const formattedToday = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(today)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header & Quick Action Hub */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-medium mb-2 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {orgName} • {formattedToday}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {profile?.full_name || "Quản trị viên"}!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Hệ thống quản lý nhà trọ đang vận hành {totalProperties} cơ sở với {occupiedRooms}/{totalRooms} phòng đang có khách thuê.
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Receipt className="h-4 w-4 text-blue-600" />
            Lập hóa đơn
          </Link>
          <Link
            href="/leases"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white border border-white/20 text-xs font-semibold backdrop-blur-sm transition-all"
          >
            <FileText className="h-4 w-4" />
            Tạo hợp đồng
          </Link>
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white border border-white/20 text-xs font-semibold backdrop-blur-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Thêm phòng
          </Link>
        </div>
      </div>

      {/* Banner giới hạn gói đăng ký & Cảnh báo Chỉ đọc nếu quá hạn */}
      <PlanLimitBanner usage={planUsage} />

      {/* 4 THẺ CHỈ SỐ KPI CHÍNH */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* 1. Tỷ lệ lấp đầy */}
        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-slate-500">Tỷ lệ lấp đầy</CardTitle>
            <div className="rounded-full p-2 bg-indigo-50">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                {occupancyRate}%
              </div>
              <Badge variant="outline" className="text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50/50">
                {occupiedRooms}/{totalRooms} phòng
              </Badge>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Còn {availableRooms} phòng trống sẵn sàng đón khách
            </p>
          </CardContent>
        </Card>

        {/* 2. Doanh thu thực thu */}
        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-emerald-600">Tiền đã thu</CardTitle>
            <div className="rounded-full p-2 bg-emerald-50">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 truncate">
              {formatVND(totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-2 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{paidInvoices.length} hóa đơn đã thanh toán xong</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Thu nhập thực tế vào tài khoản</p>
          </CardContent>
        </Card>

        {/* 3. Tiền chờ thu */}
        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-amber-600">Chờ thu tiền</CardTitle>
            <div className="rounded-full p-2 bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 truncate">
              {formatVND(pendingRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-2 font-medium">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{pendingInvoices.length} hóa đơn chưa nộp tiền</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tiền phòng & dịch vụ tồn đọng</p>
          </CardContent>
        </Card>

        {/* 4. Hợp đồng & Khách thuê */}
        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-slate-500">Hợp đồng thuê</CardTitle>
            <div className="rounded-full p-2 bg-blue-50">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {activeLeases.length}
              </div>
              <span className="text-xs font-medium text-slate-500">{totalTenants} khách thuê</span>
            </div>
            {expiringLeases.length > 0 ? (
              <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-2 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{expiringLeases.length} hợp đồng sắp hết hạn 30 ngày</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-medium">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Các hợp đồng đều trong hạn</span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">Hợp đồng đang có hiệu lực</p>
          </CardContent>
        </Card>
      </div>

      {/* KHỐI CƠ CẤU DOANH THU & CẢNH BÁO HỢP ĐỒNG */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Cơ cấu doanh thu */}
        <Card className="bg-white border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Cơ cấu doanh thu thực thu
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Phân bổ dòng tiền từ các khoản thu phòng, điện, nước và dịch vụ đi kèm.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Tổng thực thu</span>
                <span className="text-base sm:text-lg font-bold text-emerald-600">
                  {formatVND(totalRevenue)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Thanh tiến độ phân bổ màu */}
            {totalRevenue > 0 ? (
              <>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${rentPercent}%` }}
                    className="bg-blue-600 transition-all"
                    title={`Tiền phòng: ${rentPercent}%`}
                  />
                  <div
                    style={{ width: `${elecPercent}%` }}
                    className="bg-amber-500 transition-all"
                    title={`Tiền điện: ${elecPercent}%`}
                  />
                  <div
                    style={{ width: `${waterPercent}%` }}
                    className="bg-cyan-500 transition-all"
                    title={`Tiền nước: ${waterPercent}%`}
                  />
                  <div
                    style={{ width: `${otherPercent}%` }}
                    className="bg-purple-500 transition-all"
                    title={`Phụ phí & Dịch vụ: ${otherPercent}%`}
                  />
                </div>

                {/* Chi tiết từng khoản thu */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      Tiền phòng
                    </div>
                    <div className="text-sm font-bold text-blue-700 mt-1">
                      {formatVND(rentRevenue)}
                    </div>
                    <span className="text-[11px] text-blue-600/80 font-medium">{rentPercent}% doanh thu</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      Tiền điện
                    </div>
                    <div className="text-sm font-bold text-amber-700 mt-1">
                      {formatVND(elecRevenue)}
                    </div>
                    <span className="text-[11px] text-amber-600/80 font-medium">{elecPercent}% doanh thu</span>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-900">
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      Tiền nước
                    </div>
                    <div className="text-sm font-bold text-cyan-700 mt-1">
                      {formatVND(waterRevenue)}
                    </div>
                    <span className="text-[11px] text-cyan-600/80 font-medium">{waterPercent}% doanh thu</span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                      <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                      Phụ phí dịch vụ
                    </div>
                    <div className="text-sm font-bold text-purple-700 mt-1">
                      {formatVND(otherRevenue)}
                    </div>
                    <span className="text-[11px] text-purple-600/80 font-medium">{otherPercent}% doanh thu</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed">
                Chưa có hóa đơn nào được thanh toán để thống kê cơ cấu doanh thu.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hợp đồng sắp hết hạn trong 30 ngày */}
        <Card className="bg-white border shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Sắp hết hạn ({expiringLeases.length})
              </span>
              <Link href="/leases" className="text-xs font-normal text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </CardTitle>
            <CardDescription className="text-xs">
              Hợp đồng thuê cần liên hệ tái ký hoặc chuẩn bị nhận bàn giao.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expiringLeases.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <span>Không có hợp đồng nào sắp hết hạn trong 30 ngày tới.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {expiringLeases.slice(0, 4).map((lease) => {
                  const endDateObj = new Date(lease.end_date)
                  const diffTime = endDateObj.getTime() - today.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                  return (
                    <div
                      key={lease.id}
                      className="p-2.5 rounded-lg border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          Phòng {lease.room?.room_code || "---"} • {lease.tenant?.full_name || "Khách"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{lease.tenant?.phone || "Không có SĐT"}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold bg-amber-100 text-amber-800 border-amber-300"
                        >
                          {diffDays <= 0 ? "Hôm nay hết hạn" : `Còn ${diffDays} ngày`}
                        </Badge>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Hạn: {lease.end_date}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CHI TIẾT TRẠNG THÁI PHÒNG & DANH SÁCH HÓA ĐƠN CẦN THU */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Tình trạng phòng trọ & Cơ sở */}
        <Card className="bg-white border shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Trạng thái phòng ({totalRooms})</span>
              <Link href="/properties" className="text-xs font-normal text-blue-600 hover:underline">
                Quản lý phòng
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-900">Phòng trống</span>
              </div>
              <span className="text-sm font-bold text-emerald-700">{availableRooms} phòng</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-blue-900">Đang cho thuê</span>
              </div>
              <span className="text-sm font-bold text-blue-700">{occupiedRooms} phòng</span>
            </div>

            {maintenanceRooms > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-medium text-amber-900">Đang bảo trì</span>
                </div>
                <span className="text-sm font-bold text-amber-700">{maintenanceRooms} phòng</span>
              </div>
            )}

            {/* Quick link đến Bảng chỉ số điện nước */}
            <div className="pt-2">
              <Link
                href="/invoices"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-blue-600" />
                  <span>Xem bảng chỉ số điện nước các phòng</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Hóa đơn cần thu tiền */}
        <Card className="bg-white border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Hóa đơn chờ thanh toán ({pendingInvoices.length})</span>
              <Link href="/invoices" className="text-xs font-normal text-blue-600 hover:underline">
                Quản lý hóa đơn
              </Link>
            </CardTitle>
            <CardDescription className="text-xs">
              Các hóa đơn chưa thu tiền cần được theo dõi và gửi lời nhắc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPendingInvoices.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                🎉 Toàn bộ hóa đơn đã được thanh toán đầy đủ!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {topPendingInvoices.map((inv) => {
                  const roomCode = inv.lease?.room?.room_code || "---"
                  const tenantName = inv.lease?.tenant?.full_name || "Khách thuê"
                  const propName = inv.lease?.room?.property?.name || ""
                  const isOverdue = new Date(inv.due_date) < today

                  return (
                    <div
                      key={inv.id}
                      className="py-3 flex items-center justify-between gap-2 hover:bg-slate-50/60 px-2 rounded-md transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          Phòng {roomCode} • <span className="font-normal text-slate-600">{tenantName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {propName} • Kỳ {inv.period}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatVND(inv.total_amount)}</div>
                        <span
                          className={`text-[10px] font-semibold ${
                            isOverdue ? "text-rose-600" : "text-amber-600"
                          }`}
                        >
                          {isOverdue ? "Quá hạn nộp" : `Hạn: ${inv.due_date}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty State nếu chưa có cơ sở nhà trọ nào */}
      {totalProperties === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-8 text-center bg-white shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Chưa có cơ sở nhà trọ nào</h3>
          <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm nhà trọ đầu tiên của bạn vào hệ thống.</p>
          <div className="mt-6">
            <Link
              href="/properties"
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              <Building2 className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
              Thêm nhà trọ ngay
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
