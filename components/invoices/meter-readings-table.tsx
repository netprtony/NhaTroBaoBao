"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Zap, Droplets, Gauge } from "lucide-react"

export type MeterReadingDisplayItem = {
  id: string
  room_id: string
  invoice_id?: string | null
  type: "electricity" | "water"
  old_value: number
  new_value: number
  consumption: number | null
  unit_price: number
  total_amount: number
  period: string
  reading_date: string
  created_at: string
  room?: {
    room_code: string
    property?: {
      name: string
    }
  }
}

type MeterReadingsTableProps = {
  readings: MeterReadingDisplayItem[]
}

export function MeterReadingsTable({ readings }: MeterReadingsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")

  // Danh sách các kỳ
  const periods = useMemo(() => {
    const set = new Set<string>()
    readings.forEach((r) => {
      if (r.period) set.add(r.period)
    })
    return Array.from(set).sort().reverse()
  }, [readings])

  // Lọc dữ liệu
  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false
      if (periodFilter !== "all" && r.period !== periodFilter) return false

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const roomCode = r.room?.room_code?.toLowerCase() || ""
        const propName = r.room?.property?.name?.toLowerCase() || ""
        return roomCode.includes(query) || propName.includes(query) || r.period.includes(query)
      }

      return true
    })
  }, [readings, typeFilter, periodFilter, searchTerm])

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  const formatDate = (dStr: string) => {
    try {
      const d = new Date(dStr)
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`
    } catch {
      return dStr
    }
  }

  return (
    <div className="space-y-4">
      {/* Thanh bộ lọc */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3.5 rounded-lg border shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo kỳ */}
          <div className="w-36">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn kỳ thu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các kỳ</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    Tháng {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lọc theo loại (Điện / Nước) */}
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-auto">
            <TabsList className="h-9 p-0.5">
              <TabsTrigger value="all" className="text-xs px-3">
                Tất cả
              </TabsTrigger>
              <TabsTrigger value="electricity" className="text-xs px-3 gap-1 text-amber-700">
                <Zap className="h-3.5 w-3.5" />
                Điện
              </TabsTrigger>
              <TabsTrigger value="water" className="text-xs px-3 gap-1 text-cyan-700">
                <Droplets className="h-3.5 w-3.5" />
                Nước
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tìm kiếm */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo phòng, nhà trọ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Bảng dữ liệu */}
      {filteredReadings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center bg-white">
          <Gauge className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            Chưa có chỉ số điện nước nào
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Khi bạn tạo hóa đơn và nhập chỉ số công tơ, hệ thống sẽ tự động lưu và hiển thị lịch sử chỉ số của từng phòng tại đây.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Phòng & Nhà trọ</th>
                  <th className="py-3 px-4">Loại chỉ số</th>
                  <th className="py-3 px-4 text-center">Kỳ chốt</th>
                  <th className="py-3 px-4 text-right">Chỉ số cũ</th>
                  <th className="py-3 px-4 text-right">Chỉ số mới</th>
                  <th className="py-3 px-4 text-right">Tiêu thụ</th>
                  <th className="py-3 px-4 text-right">Đơn giá</th>
                  <th className="py-3 px-4 text-right">Thành tiền</th>
                  <th className="py-3 px-4 text-center">Ngày chốt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReadings.map((r) => {
                  const isElec = r.type === "electricity"
                  const roomCode = r.room?.room_code || "---"
                  const propName = r.room?.property?.name || ""
                  const unit = isElec ? "kWh" : "m³"
                  const consumption = r.consumption !== null ? r.consumption : Math.max(0, r.new_value - r.old_value)

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Phòng */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">Phòng {roomCode}</div>
                        <div className="text-[11px] text-slate-400">{propName}</div>
                      </td>

                      {/* Loại */}
                      <td className="py-3 px-4">
                        {isElec ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700 border border-amber-200">
                            <Zap className="h-3 w-3" />
                            Điện
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 font-semibold text-cyan-700 border border-cyan-200">
                            <Droplets className="h-3 w-3" />
                            Nước
                          </span>
                        )}
                      </td>

                      {/* Kỳ */}
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        Tháng {r.period}
                      </td>

                      {/* Số cũ */}
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">
                        {r.old_value} {unit}
                      </td>

                      {/* Số mới */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {r.new_value} {unit}
                      </td>

                      {/* Tiêu thụ */}
                      <td className="py-3 px-4 text-right font-bold text-blue-700 font-mono">
                        {consumption} {unit}
                      </td>

                      {/* Đơn giá */}
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatVND(r.unit_price)}
                      </td>

                      {/* Thành tiền */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatVND(r.total_amount)}
                      </td>

                      {/* Ngày ghi */}
                      <td className="py-3 px-4 text-center text-slate-400">
                        {formatDate(r.reading_date || r.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}