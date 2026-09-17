import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Zap, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Chỉ số Điện Nước - Cổng Khách thuê - BaoBao Stay",
}

type GroupedMeterReading = {
  period: string
  room_code: string
  electricity_old: number
  electricity_new: number
  electricity_cons: number
  electricity_price: number
  electricity_total: number
  water_old: number
  water_new: number
  water_cons: number
  water_price: number
  water_total: number
  created_at: string
}

export default async function PortalMeterReadingsPage() {
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
    .select("id")
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

  // Fetch tenant room IDs from leases
  const { data: leases } = await supabase
    .from("leases")
    .select("room_id, room:rooms(room_code)")
    .eq("tenant_id", tenant.id)

  const roomIds = leases?.map((l) => l.room_id) || []

  const groupedReadings: GroupedMeterReading[] = []

  if (roomIds.length > 0) {
    const { data: meterData } = await supabase
      .from("meter_readings")
      .select("*, room:rooms(room_code)")
      .in("room_id", roomIds)
      .order("created_at", { ascending: false })

    if (meterData) {
      const map: Record<string, GroupedMeterReading> = {}

      meterData.forEach((r) => {
        const roomCode = (r.room as unknown as { room_code: string })?.room_code || "---"
        const key = `${r.room_id}_${r.period}`

        if (!map[key]) {
          map[key] = {
            period: r.period,
            room_code: roomCode,
            electricity_old: 0,
            electricity_new: 0,
            electricity_cons: 0,
            electricity_price: 0,
            electricity_total: 0,
            water_old: 0,
            water_new: 0,
            water_cons: 0,
            water_price: 0,
            water_total: 0,
            created_at: r.created_at,
          }
        }

        if (r.type === "electricity") {
          map[key].electricity_old = r.old_value
          map[key].electricity_new = r.new_value
          map[key].electricity_cons = r.consumption ?? Math.max(0, r.new_value - r.old_value)
          map[key].electricity_price = r.unit_price
          map[key].electricity_total = r.total_amount
        } else if (r.type === "water") {
          map[key].water_old = r.old_value
          map[key].water_new = r.new_value
          map[key].water_cons = r.consumption ?? Math.max(0, r.new_value - r.old_value)
          map[key].water_price = r.unit_price
          map[key].water_total = r.total_amount
        }
      })

      groupedReadings.push(...Object.values(map))
    }
  }

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Zap className="h-6 w-6 text-amber-400" /> Chỉ số Điện & Nước
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Theo dõi lịch sử ghi chỉ số công tơ điện nước hàng tháng cho phòng trọ của bạn.
        </p>
      </div>

      {groupedReadings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
          <Zap className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">Chưa có dữ liệu chỉ số</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md">
            Chưa có chỉ số điện nước nào được chủ trọ cập nhật cho kỳ này.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-slate-950/80">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-300">Kỳ chốt số</TableHead>
                <TableHead className="text-slate-300">Phòng</TableHead>
                <TableHead className="text-amber-400">⚡ Chỉ số Điện (kWh)</TableHead>
                <TableHead className="text-blue-400">💧 Chỉ số Nước (m³)</TableHead>
                <TableHead className="text-right text-emerald-400">Tổng tiền điện nước</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedReadings.map((r) => {
                const totalCost = r.electricity_total + r.water_total

                return (
                  <TableRow key={`${r.room_code}_${r.period}`} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-semibold text-white">
                      Tháng {r.period}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200">
                        P.{r.room_code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs text-slate-400">
                          Mới: <span className="text-slate-200 font-semibold">{r.electricity_new}</span> • Cũ: <span>{r.electricity_old}</span>
                        </div>
                        <div className="text-sm font-bold text-amber-400">
                          Sử dụng: {r.electricity_cons} kWh ({formatVND(r.electricity_total)})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs text-slate-400">
                          Mới: <span className="text-slate-200 font-semibold">{r.water_new}</span> • Cũ: <span>{r.water_old}</span>
                        </div>
                        <div className="text-sm font-bold text-blue-400">
                          Sử dụng: {r.water_cons} m³ ({formatVND(r.water_total)})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-400 text-base">
                      {formatVND(totalCost)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
