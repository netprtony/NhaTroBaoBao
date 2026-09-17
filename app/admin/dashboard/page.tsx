import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Building2, Home, Users, ShieldAlert, Receipt, ArrowRight, CheckCircle2, AlertOctagon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Bảng điều khiển Superadmin - BaoBao Stay",
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch global platform statistics
  const [
    { count: totalOrgs },
    { count: suspendedOrgs },
    { count: totalProperties },
    { count: totalRooms },
    { count: totalTenants },
    { count: totalInvoices },
  ] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("is_suspended", true),
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("rooms").select("*", { count: "exact", head: true }),
    supabase.from("tenants").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("invoices").select("*", { count: "exact", head: true }),
  ])

  // Fetch recent organizations with owner profiles
  const { data: recentOrgs } = await supabase
    .from("organizations")
    .select("*, profiles!profiles_org_id_fkey(*), properties(count), rooms(count), tenants(count)")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-violet-400" /> Bảng điều khiển Quản trị Platform
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thống kê quy mô toàn bộ hệ thống SaaS nhà trọ BaoBao Stay.
          </p>
        </div>
        <Link href="/admin/organizations">
          <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 text-xs">
            Quản lý tất cả Tổ chức <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng Tổ chức (Orgs)
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">{totalOrgs || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Số lượng hệ thống chủ trọ</p>
          </CardContent>
        </Card>

        {/* Stat 2 */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nhà trọ & Phòng
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Home className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">{totalRooms || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Trong tổng số {totalProperties || 0} dãy nhà trọ</p>
          </CardContent>
        </Card>

        {/* Stat 3 */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng Khách thuê
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">{totalTenants || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Tài khoản khách lưu trú active</p>
          </CardContent>
        </Card>

        {/* Stat 4 */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổ chức Tạm khóa
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-rose-400">{suspendedOrgs || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Tổ chức ngưng hoạt động</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Organizations Section */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-white">Tổ chức mới tham gia</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Danh sách 5 tổ chức chủ trọ được khởi tạo gần đây nhất.
              </CardDescription>
            </div>
            <Link href="/admin/organizations">
              <Button size="sm" variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800 text-xs">
                Xem tất cả ({totalOrgs})
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Tên Tổ chức</th>
                  <th className="p-4">Chủ sở hữu (Profile)</th>
                  <th className="p-4 text-center">Nhà trọ</th>
                  <th className="p-4 text-center">Phòng</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!recentOrgs || recentOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Chưa có tổ chức nào trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  recentOrgs.map((org) => {
                    const profiles = org.profiles as unknown as { full_name?: string; role?: string }[] | null
                    const owner = profiles?.find((p) => p.role === "owner") || profiles?.[0]
                    const propCount = (org.properties as unknown as { count: number }[])?.[0]?.count || 0
                    const roomCount = (org.rooms as unknown as { count: number }[])?.[0]?.count || 0

                    return (
                      <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-white">
                          <Link href={`/admin/organizations/${org.id}`} className="hover:underline hover:text-violet-400">
                            {org.name}
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-200 font-medium block">
                            {owner?.full_name || "Chưa cập nhật"}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-300">{propCount}</td>
                        <td className="p-4 text-center font-mono text-slate-300">{roomCount}</td>
                        <td className="p-4 text-slate-400">
                          {new Date(org.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="p-4 text-center">
                          {org.is_suspended ? (
                            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 gap-1 text-[11px]">
                              <AlertOctagon className="h-3 w-3" /> Đã khóa
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Hoạt động
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/admin/organizations/${org.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 text-violet-400 hover:text-violet-300 hover:bg-violet-950/50 text-xs">
                              Chi tiết
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
