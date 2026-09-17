"use client"

import { useState, useTransition } from "react"
import { saveBatchReadings, saveSingleReading } from "@/app/(dashboard)/utility-readings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, Droplets, Save, Calendar, Building2, CheckCircle2, AlertCircle, RefreshCw, Calculator } from "lucide-react"
import { Tables } from "@/types/database.types"

export type PropertyWithRooms = Tables<"properties"> & {
  rooms: Array<Tables<"rooms"> & {
    leases?: Array<{
      id: string
      status: string
      tenant?: { full_name: string } | null
    }> | null
  }>
}

export type MeterReadingRow = Tables<"meter_readings">

interface UtilityReadingsClientProps {
  properties: PropertyWithRooms[]
  existingReadings: MeterReadingRow[]
  previousReadings: MeterReadingRow[] // Last month's readings to auto-fill old values
  defaultPeriod: string
  defaultElecPrice?: number
  defaultWaterPrice?: number
}

type LocalRoomState = {
  roomId: string
  electricityOld: number
  electricityNew: number
  waterOld: number
  waterNew: number
  meterReplaced: boolean
}

export function UtilityReadingsClient({
  properties,
  existingReadings,
  previousReadings,
  defaultPeriod,
  defaultElecPrice = 3500,
  defaultWaterPrice = 20000,
}: UtilityReadingsClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    properties.length > 0 ? properties[0].id : "all"
  )
  const [period, setPeriod] = useState<string>(defaultPeriod)
  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Map of roomId -> local reading state
  const [localReadings, setLocalReadings] = useState<Record<string, LocalRoomState>>(() => {
    const map: Record<string, LocalRoomState> = {}

    properties.forEach((p) => {
      p.rooms.forEach((r) => {
        const existElec = existingReadings.find((er) => er.room_id === r.id && er.period === defaultPeriod && er.type === "electricity")
        const existWater = existingReadings.find((er) => er.room_id === r.id && er.period === defaultPeriod && er.type === "water")

        const prevElec = previousReadings.find((pr) => pr.room_id === r.id && pr.type === "electricity")
        const prevWater = previousReadings.find((pr) => pr.room_id === r.id && pr.type === "water")

        map[r.id] = {
          roomId: r.id,
          electricityOld: existElec ? existElec.old_value : prevElec ? prevElec.new_value : 0,
          electricityNew: existElec ? existElec.new_value : prevElec ? prevElec.new_value : 0,
          waterOld: existWater ? existWater.old_value : prevWater ? prevWater.new_value : 0,
          waterNew: existWater ? existWater.new_value : prevWater ? prevWater.new_value : 0,
          meterReplaced: false,
        }
      })
    })

    return map
  })

  // Filter properties & rooms
  const activeProperties = selectedPropertyId === "all"
    ? properties
    : properties.filter((p) => p.id === selectedPropertyId)

  const allFilteredRooms = activeProperties.flatMap((p) =>
    p.rooms.map((r) => ({ ...r, propertyName: p.name }))
  )

  const handleReadingChange = (roomId: string, field: keyof LocalRoomState, value: number | boolean) => {
    setLocalReadings((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value,
      },
    }))
  }

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  // Calculate totals
  let totalElecKwh = 0
  let totalWaterM3 = 0
  let recordedCount = 0

  allFilteredRooms.forEach((r) => {
    const state = localReadings[r.id]
    if (state) {
      const eDiff = Math.max(0, state.electricityNew - state.electricityOld)
      const wDiff = Math.max(0, state.waterNew - state.waterOld)
      totalElecKwh += eDiff
      totalWaterM3 += wDiff
      if (state.electricityNew > 0 || state.waterNew > 0) {
        recordedCount++
      }
    }
  })

  const totalElecCost = totalElecKwh * defaultElecPrice
  const totalWaterCost = totalWaterM3 * defaultWaterPrice

  const handleSaveAll = () => {
    setStatusMessage(null)
    startTransition(async () => {
      const itemsToSave = allFilteredRooms.map((r) => localReadings[r.id])
      const formData = new FormData()
      formData.append("period", period)
      formData.append("readingsJson", JSON.stringify(itemsToSave))

      const res = await saveBatchReadings(null, formData)
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error })
      } else if (res?.message) {
        setStatusMessage({ type: "success", text: res.message })
      }
    })
  }

  const handleSaveSingle = (roomId: string) => {
    const state = localReadings[roomId]
    if (!state) return
    setStatusMessage(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.append("roomId", roomId)
      formData.append("period", period)
      formData.append("electricityOld", String(state.electricityOld))
      formData.append("electricityNew", String(state.electricityNew))
      formData.append("waterOld", String(state.waterOld))
      formData.append("waterNew", String(state.waterNew))
      formData.append("meterReplaced", String(state.meterReplaced))

      const res = await saveSingleReading(null, formData)
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error })
      } else if (res?.message) {
        setStatusMessage({ type: "success", text: res.message })
      }
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="h-7 w-7 text-amber-500" /> Chỉ số Điện & Nước
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ghi và chốt chỉ số công tơ điện nước hàng tháng theo từng nhà trọ để lập hóa đơn.
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={isPending || allFilteredRooms.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md gap-2"
        >
          {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu tất cả phòng ({allFilteredRooms.length})
        </Button>
      </div>

      {/* Control bar: Property select & Period selector */}
      <div className="grid gap-4 sm:grid-cols-3 bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <Label className="text-xs text-slate-500 mb-1.5 block">Chọn Nhà trọ / Khu vực</Label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Chọn nhà trọ..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhà trọ ({properties.length})</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.rooms.length} phòng)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-slate-500 mb-1.5 block">Kỳ chốt số (Tháng/Năm)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="MM/YYYY (VD: 09/2026)"
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        <div className="flex items-end">
          <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border w-full">
            <div>Đơn giá điện: <strong className="text-amber-600">{formatVND(defaultElecPrice)}/kWh</strong></div>
            <div>Đơn giá nước: <strong className="text-blue-600">{formatVND(defaultWaterPrice)}/m³</strong></div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-sm font-medium border flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
          {statusMessage.text}
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-amber-50/50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 font-medium">Tổng điện tiêu thụ kỳ này</p>
              <p className="text-2xl font-extrabold text-amber-900 mt-1">{totalElecKwh} kWh</p>
              <p className="text-xs text-amber-600 mt-0.5 font-medium">Tạm tính: {formatVND(totalElecCost)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-700 font-medium">Tổng nước tiêu thụ kỳ này</p>
              <p className="text-2xl font-extrabold text-blue-900 mt-1">{totalWaterM3} m³</p>
              <p className="text-xs text-blue-600 mt-0.5 font-medium">Tạm tính: {formatVND(totalWaterCost)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Droplets className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-medium">Tiến độ chốt số</p>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                {recordedCount} / {allFilteredRooms.length} <span className="text-xs font-normal">phòng</span>
              </p>
              <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                {allFilteredRooms.length > 0 ? `${Math.round((recordedCount / allFilteredRooms.length) * 100)}% hoàn thành` : "0%"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table of Rooms */}
      {allFilteredRooms.length === 0 ? (
        <div className="p-12 text-center bg-white border rounded-xl">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Không có phòng nào</h3>
          <p className="text-sm text-slate-500 mt-1">
            Chưa có thông tin phòng trọ trong nhà trọ đã chọn.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeProperties.map((prop) => (
            <Card key={prop.id} className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-slate-50 py-3.5 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base text-slate-900 font-bold">{prop.name}</CardTitle>
                    <Badge variant="outline" className="bg-white text-slate-600">
                      {prop.rooms.length} phòng
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">{prop.address}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-3">Phòng</th>
                      <th className="p-3">Khách thuê</th>
                      <th className="p-3 bg-amber-50/50 text-amber-900">⚡ Điện cũ</th>
                      <th className="p-3 bg-amber-50/50 text-amber-900">⚡ Điện mới</th>
                      <th className="p-3 bg-amber-50/50 text-amber-900">Sử dụng (kWh)</th>
                      <th className="p-3 bg-blue-50/50 text-blue-900">💧 Nước cũ</th>
                      <th className="p-3 bg-blue-50/50 text-blue-900">💧 Nước mới</th>
                      <th className="p-3 bg-blue-50/50 text-blue-900">Sử dụng (m³)</th>
                      <th className="p-3 text-center">Thay công tơ</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {prop.rooms.map((room) => {
                      const state = localReadings[room.id] || {
                        roomId: room.id,
                        electricityOld: 0,
                        electricityNew: 0,
                        waterOld: 0,
                        waterNew: 0,
                        meterReplaced: false,
                      }

                      const activeLease = room.leases?.find((l) => l.status === "active")
                      const tenantName = activeLease?.tenant?.full_name

                      const elecUse = Math.max(0, state.electricityNew - state.electricityOld)
                      const waterUse = Math.max(0, state.waterNew - state.waterOld)

                      return (
                        <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            P.{room.room_code}
                          </td>
                          <td className="p-3">
                            {tenantName ? (
                              <span className="font-semibold text-slate-800">{tenantName}</span>
                            ) : (
                              <span className="text-slate-400 italic">Trống</span>
                            )}
                          </td>

                          {/* Electricity Inputs */}
                          <td className="p-2 bg-amber-50/20">
                            <Input
                              type="number"
                              value={state.electricityOld}
                              onChange={(e) => handleReadingChange(room.id, "electricityOld", Number(e.target.value))}
                              className="h-8 w-20 text-xs bg-white border-amber-200"
                            />
                          </td>
                          <td className="p-2 bg-amber-50/20">
                            <Input
                              type="number"
                              value={state.electricityNew}
                              onChange={(e) => handleReadingChange(room.id, "electricityNew", Number(e.target.value))}
                              className="h-8 w-20 text-xs bg-white border-amber-300 font-semibold text-amber-900"
                            />
                          </td>
                          <td className="p-3 bg-amber-50/20 font-bold text-amber-700">
                            {elecUse} kWh
                          </td>

                          {/* Water Inputs */}
                          <td className="p-2 bg-blue-50/20">
                            <Input
                              type="number"
                              value={state.waterOld}
                              onChange={(e) => handleReadingChange(room.id, "waterOld", Number(e.target.value))}
                              className="h-8 w-20 text-xs bg-white border-blue-200"
                            />
                          </td>
                          <td className="p-2 bg-blue-50/20">
                            <Input
                              type="number"
                              value={state.waterNew}
                              onChange={(e) => handleReadingChange(room.id, "waterNew", Number(e.target.value))}
                              className="h-8 w-20 text-xs bg-white border-blue-300 font-semibold text-blue-900"
                            />
                          </td>
                          <td className="p-3 bg-blue-50/20 font-bold text-blue-700">
                            {waterUse} m³
                          </td>

                          {/* Replaced meter checkbox */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={state.meterReplaced}
                                onCheckedChange={(val) => handleReadingChange(room.id, "meterReplaced", Boolean(val))}
                              />
                            </div>
                          </td>

                          {/* Action button */}
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveSingle(room.id)}
                              disabled={isPending}
                              className="h-8 text-xs border-slate-300 hover:bg-blue-50 hover:text-blue-600"
                            >
                              Lưu dòng này
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
