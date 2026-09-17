import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FileText, ShieldCheck, Download, AlertCircle, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Hợp đồng thuê - Cổng Khách thuê - BaoBao Stay",
}

export default async function PortalContractPage() {
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
    .select("id, full_name, phone, id_card_number, email")
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (!tenant) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Chưa tìm thấy thông tin khách thuê</h2>
      </div>
    )
  }

  // Fetch leases
  const { data: leases } = await supabase
    .from("leases")
    .select("*, room:rooms(*, property:properties(*))")
    .eq("tenant_id", tenant.id)
    .order("start_date", { ascending: false })

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-400" /> Hợp đồng Thuê phòng
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Thông tin chi tiết hợp đồng, thời hạn thuê, tiền đặt cọc và điều khoản cam kết.
        </p>
      </div>

      {!leases || leases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
          <FileText className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">Chưa có hợp đồng nào</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md">
            Bạn chưa có hợp đồng thuê phòng chính thức nào được đăng ký trong hệ thống.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {leases.map((lease) => {
            const room = lease.room as unknown as {
              room_code: string
              area: number | null
              property: { name: string; address: string }
            }
            const isActive = lease.status === "active"

            return (
              <Card key={lease.id} className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-900/80 border-b border-slate-800/80 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Home className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">
                          Hợp đồng Thuê Phòng P.{room?.room_code || "---"}
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">
                          {room?.property?.name} • {room?.property?.address}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" /> Đang hiệu lực
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-700">
                          {lease.status === "expired" ? "Đã hết hạn" : "Đã thanh lý"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Grid details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-400 block mb-1">Giá thuê hàng tháng</span>
                      <strong className="text-base font-bold text-emerald-400">{formatVND(lease.monthly_rent)}</strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-400 block mb-1">Tiền đặt cọc</span>
                      <strong className="text-base font-bold text-amber-400">{formatVND(lease.deposit)}</strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-400 block mb-1">Ngày bắt đầu</span>
                      <strong className="text-sm font-semibold text-slate-200">
                        {new Date(lease.start_date).toLocaleDateString("vi-VN")}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-400 block mb-1">Ngày kết thúc</span>
                      <strong className="text-sm font-semibold text-slate-200">
                        {lease.end_date ? new Date(lease.end_date).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                      </strong>
                    </div>
                  </div>

                  {/* Tenant information in contract */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400">
                      Bên Thuê (Khách hàng):
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                      <div>Họ và tên: <strong className="text-white">{tenant.full_name}</strong></div>
                      <div>Số điện thoại: <strong className="text-white">{tenant.phone}</strong></div>
                      <div>Số CCCD: <strong className="text-white">{tenant.id_card_number || "Chưa cập nhật"}</strong></div>
                    </div>
                  </div>

                  {/* Contract file attachment */}
                  {lease.contract_file_url ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                      <div className="flex items-center gap-2 text-blue-300 font-medium">
                        <FileText className="h-4 w-4" />
                        <span>File bản sao hợp đồng đã ký kết (PDF)</span>
                      </div>
                      <a href={lease.contract_file_url} target="_blank" rel="noreferrer">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" /> Tải về
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      * Chủ nhà trọ chưa tải lên file scan hợp đồng PDF đính kèm.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
