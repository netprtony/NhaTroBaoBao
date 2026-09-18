import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Building2, ArrowLeft, CheckCircle2, AlertOctagon, Users, Receipt, User, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SuspendOrgDialog } from "@/components/admin/suspend-org-dialog"

export const metadata = {
  title: "Chi tiết Tổ chức - Superadmin - BaoBao Stay",
}

interface PageProps {
  params: Promise<{ orgId: string }>
}

export default async function AdminOrgDetailPage({ params }: PageProps) {
  const { orgId } = await params
  const supabase = await createClient()

  // Fetch org details
  const { data: org } = await supabase
    .from("organizations")
    .select("*, profiles!profiles_org_id_fkey(*)")
    .eq("id", orgId)
    .single()

  if (!org) {
    notFound()
  }

  // Fetch properties
  const { data: properties } = await supabase
    .from("properties")
    .select("*, rooms(count)")
    .eq("org_id", orgId)
    .is("deleted_at", null)

  // Fetch rooms
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*, property:properties(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)

  // Fetch tenants
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)

  // Fetch invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, lease:leases(*, room:rooms(room_code))")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  const profiles = org.profiles as unknown as { id: string; full_name?: string; role?: string }[] | null
  const owner = profiles?.find((p) => p.role === "owner") || profiles?.[0]

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div>
        <Link href="/admin/organizations">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-2 text-xs mb-3">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách Tổ chức
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">{org.name}</h1>
              {org.is_suspended ? (
                <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 gap-1 text-xs">
                  <AlertOctagon className="h-3.5 w-3.5" /> Đã tạm khóa
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đang hoạt động
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              ID: {org.id} • Ngày tạo: {new Date(org.created_at).toLocaleString("vi-VN")}
            </p>
          </div>

          <SuspendOrgDialog
            orgId={org.id}
            orgName={org.name}
            isSuspended={org.is_suspended}
            currentReason={org.suspension_reason}
          />
        </div>
      </div>

      {/* Suspension warning banner if suspended */}
      {org.is_suspended && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-start gap-3 text-xs text-rose-200">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sm font-bold text-white mb-0.5">Tổ chức đang trong trạng thái tạm khóa!</strong>
            <p className="text-slate-300">
              Lý do: <span className="italic font-semibold text-rose-300">{org.suspension_reason || "Không có lý do"}</span>
            </p>
            {org.suspended_at && (
              <p className="text-slate-400 text-[11px] mt-1">
                Khóa lúc: {new Date(org.suspended_at).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Owner Info Card */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <User className="h-4 w-4 text-violet-400" /> Thông tin Chủ sở hữu (Owner Profile)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Họ và tên Chủ trọ</span>
            <strong className="text-sm font-bold text-white">{owner?.full_name || "Chưa cập nhật"}</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Vai trò</span>
            <strong className="text-sm font-semibold text-violet-400 uppercase">{owner?.role || "owner"}</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">User ID (Auth)</span>
            <strong className="text-xs font-mono text-slate-300 truncate block">{owner?.id || "---"}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100">
          <span className="text-xs text-slate-400 block mb-1">Số Nhà trọ</span>
          <strong className="text-2xl font-bold text-white">{properties?.length || 0}</strong>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100">
          <span className="text-xs text-slate-400 block mb-1">Số Phòng trọ</span>
          <strong className="text-2xl font-bold text-white">{rooms?.length || 0}</strong>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100">
          <span className="text-xs text-slate-400 block mb-1">Số Khách thuê</span>
          <strong className="text-2xl font-bold text-white">{tenants?.length || 0}</strong>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100">
          <span className="text-xs text-slate-400 block mb-1">Số Hóa đơn đã lập</span>
          <strong className="text-2xl font-bold text-white">{invoices?.length || 0}</strong>
        </div>
      </div>

      {/* Read-Only Grid: Properties & Rooms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties List */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" /> Danh sách Dãy nhà trọ ({properties?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {!properties || properties.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Tổ chức chưa khởi tạo nhà trọ nào.</p>
            ) : (
              properties.map((prop) => {
                const rCount = (prop.rooms as unknown as { count: number }[])?.[0]?.count || 0
                return (
                  <div key={prop.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-sm text-white font-bold">{prop.name}</strong>
                      <Badge variant="outline" className="text-slate-400 border-slate-700 text-[11px]">
                        {rCount} phòng
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{prop.address}</p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Tenants List */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" /> Danh sách Khách thuê ({tenants?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {!tenants || tenants.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Tổ chức chưa thêm khách thuê nào.</p>
            ) : (
              tenants.map((t) => (
                <div key={t.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white font-bold block">{t.full_name}</strong>
                    <span className="text-slate-400">SĐT: {t.phone}</span>
                  </div>
                  {t.portal_enabled ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Cổng: Bật
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 border-slate-800 text-[10px]">
                      Cổng: Tắt
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices List (Read-only) */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
        <CardHeader className="border-b border-slate-800 pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-amber-400" /> Lịch sử Hóa đơn Tổ chức ({invoices?.length || 0})
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Theo dõi hóa đơn thanh toán tiền phòng & điện nước của tổ chức này (Read-only).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Mã / Kỳ HD</th>
                  <th className="p-4">Phòng</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-right">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!invoices || invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Chưa có hóa đơn nào được khởi tạo.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const roomCode = (inv.lease as unknown as { room?: { room_code: string } })?.room?.room_code || "---"
                    const isPaid = inv.status === "paid"

                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-bold text-white">Kỳ {inv.period}</td>
                        <td className="p-4 font-semibold text-slate-200">Phòng {roomCode}</td>
                        <td className="p-4 font-mono font-bold text-emerald-400">{formatVND(inv.total_amount)}</td>
                        <td className="p-4 text-center">
                          {isPaid ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                              Đã thanh toán
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                              Chờ thanh toán
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right text-slate-400">
                          {new Date(inv.created_at).toLocaleDateString("vi-VN")}
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
