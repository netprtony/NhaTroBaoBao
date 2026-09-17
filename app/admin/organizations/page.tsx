import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Building2, Search, CheckCircle2, AlertOctagon, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SuspendOrgDialog } from "@/components/admin/suspend-org-dialog"

export const metadata = {
  title: "Quản lý Tổ chức - Superadmin - BaoBao Stay",
}

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function AdminOrganizationsPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  // Fetch all organizations with details
  let query = supabase
    .from("organizations")
    .select("*, profiles!profiles_org_id_fkey(*), properties(count), rooms(count), tenants(count)")
    .order("created_at", { ascending: false })

  if (status === "suspended") {
    query = query.eq("is_suspended", true)
  } else if (status === "active") {
    query = query.eq("is_suspended", false)
  }

  if (q && q.trim()) {
    const searchQuery = `%${q.trim()}%`
    query = query.ilike("name", searchQuery)
  }

  const { data: orgs } = await query

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Building2 className="h-6 w-6 text-violet-400" /> Quản lý Tổ chức Chủ trọ
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Danh sách toàn bộ các tổ chức SaaS, theo dõi trạng thái hoạt động và quản lý quyền truy cập.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 p-4 shadow-xl">
        <form method="GET" className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Tìm kiếm theo tên tổ chức..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              name="status"
              defaultValue={status || "all"}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="suspended">Đã tạm khóa</option>
            </select>
            <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-500 text-white text-xs">
              Lọc
            </Button>
            {(q || status) && (
              <Link href="/admin/organizations">
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white text-xs">
                  Xóa lọc
                </Button>
              </Link>
            )}
          </div>
        </form>
      </Card>

      {/* Organizations Table */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Tên Tổ chức</th>
                  <th className="p-4">Chủ sở hữu (Owner Profile)</th>
                  <th className="p-4 text-center">Nhà trọ</th>
                  <th className="p-4 text-center">Phòng trọ</th>
                  <th className="p-4 text-center">Khách thuê</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!orgs || orgs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Không tìm thấy tổ chức nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  orgs.map((org) => {
                    const profiles = org.profiles as unknown as { full_name?: string; role?: string }[] | null
                    const owner = profiles?.find((p) => p.role === "owner") || profiles?.[0]
                    const propCount = (org.properties as unknown as { count: number }[])?.[0]?.count || 0
                    const roomCount = (org.rooms as unknown as { count: number }[])?.[0]?.count || 0
                    const tenantCount = (org.tenants as unknown as { count: number }[])?.[0]?.count || 0

                    return (
                      <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            className="font-bold text-white hover:underline hover:text-violet-400 block text-sm"
                          >
                            {org.name}
                          </Link>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {org.id.slice(0, 8)}...</span>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-200 font-medium block">
                            {owner?.full_name || "Chưa cập nhật"}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-slate-200">{propCount}</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-200">{roomCount}</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-200">{tenantCount}</td>
                        <td className="p-4 text-center">
                          {org.is_suspended ? (
                            <div className="space-y-1">
                              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 gap-1 text-[11px]">
                                <AlertOctagon className="h-3 w-3" /> Đã tạm khóa
                              </Badge>
                            </div>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Hoạt động
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/organizations/${org.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs text-slate-300 border-slate-700 hover:bg-slate-800 gap-1"
                              >
                                Xem <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                            <SuspendOrgDialog
                              orgId={org.id}
                              orgName={org.name}
                              isSuspended={org.is_suspended}
                              currentReason={org.suspension_reason}
                            />
                          </div>
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
