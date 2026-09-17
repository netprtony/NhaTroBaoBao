"use client"

import { useState, useEffect, useCallback, useActionState } from "react"
import { saveSingleReading } from "@/app/(dashboard)/utility-readings/actions"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Zap, Droplets, Save, History, Loader2, CheckCircle2 } from "lucide-react"

interface RoomReadingsDialogProps {
  roomId: string
  roomCode: string
  trigger?: React.ReactNode
}

type GroupedHistoryItem = {
  period: string
  elecOld: number
  elecNew: number
  elecCons: number
  waterOld: number
  waterNew: number
  waterCons: number
  totalAmount: number
  created_at: string
}

export function RoomReadingsDialog({ roomId, roomCode, trigger }: RoomReadingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [readingsHistory, setReadingsHistory] = useState<GroupedHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const now = new Date()
  const monthStr = (now.getMonth() + 1).toString().padStart(2, "0")
  const defaultPeriod = `${monthStr}/${now.getFullYear()}`

  const [period, setPeriod] = useState(defaultPeriod)
  const [elecOld, setElecOld] = useState(0)
  const [elecNew, setElecNew] = useState(0)
  const [waterOld, setWaterOld] = useState(0)
  const [waterNew, setWaterNew] = useState(0)
  const [meterReplaced, setMeterReplaced] = useState(false)

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("meter_readings")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })

    if (data && data.length > 0) {
      // Group by period
      const periodsMap: Record<string, GroupedHistoryItem> = {}
      data.forEach((r) => {
        if (!periodsMap[r.period]) {
          periodsMap[r.period] = {
            period: r.period,
            elecOld: 0,
            elecNew: 0,
            elecCons: 0,
            waterOld: 0,
            waterNew: 0,
            waterCons: 0,
            totalAmount: 0,
            created_at: r.created_at,
          }
        }

        if (r.type === "electricity") {
          periodsMap[r.period].elecOld = r.old_value
          periodsMap[r.period].elecNew = r.new_value
          periodsMap[r.period].elecCons = r.consumption ?? Math.max(0, r.new_value - r.old_value)
          periodsMap[r.period].totalAmount += r.total_amount || 0
        } else if (r.type === "water") {
          periodsMap[r.period].waterOld = r.old_value
          periodsMap[r.period].waterNew = r.new_value
          periodsMap[r.period].waterCons = r.consumption ?? Math.max(0, r.new_value - r.old_value)
          periodsMap[r.period].totalAmount += r.total_amount || 0
        }
      })

      const list = Object.values(periodsMap)
      setReadingsHistory(list)

      if (list.length > 0) {
        const latest = list[0]
        setElecOld(latest.elecNew)
        setElecNew(latest.elecNew)
        setWaterOld(latest.waterNew)
        setWaterNew(latest.waterNew)
      }
    } else {
      setReadingsHistory([])
    }
    setLoadingHistory(false)
  }, [roomId])

  const [state, formAction, pending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const res = await saveSingleReading(prevState as { error?: string }, formData)
      if (res.success) {
        fetchHistory()
      }
      return res
    },
    null
  )

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open, fetchHistory])

  const elecUse = Math.max(0, elecNew - elecOld)
  const waterUse = Math.max(0, waterNew - waterOld)

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Chỉ số điện nước
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
            <Zap className="h-5 w-5 text-amber-500" />
            Chỉ số Điện Nước — Phòng P.{roomCode}
          </DialogTitle>
          <DialogDescription>
            Ghi nhận số công tơ điện nước và xem lịch sử tiêu thụ theo từng tháng.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 py-2 border-b pb-4">
          <input type="hidden" name="roomId" value={roomId} />
          <input type="hidden" name="meterReplaced" value={String(meterReplaced)} />

          {state?.error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {state.error}
            </div>
          )}

          {state?.message && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {state.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600">Kỳ chốt số (MM/YYYY)</Label>
              <Input
                name="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="VD: 09/2026"
                className="h-8 text-xs mt-1"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="dialogMeterReplaced"
                checked={meterReplaced}
                onCheckedChange={(v) => setMeterReplaced(Boolean(v))}
              />
              <Label htmlFor="dialogMeterReplaced" className="text-xs text-slate-600 cursor-pointer">
                Đổi/Thay mới công tơ
              </Label>
            </div>
          </div>

          {/* Electricity Section */}
          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-amber-600" /> Chỉ số Điện (kWh)
              </span>
              <span>Sử dụng: <strong className="text-amber-700 font-extrabold">{elecUse} kWh</strong></span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-amber-800">Chỉ số cũ</Label>
                <Input
                  type="number"
                  name="electricityOld"
                  value={elecOld}
                  onChange={(e) => setElecOld(Number(e.target.value))}
                  className="h-8 text-xs bg-white border-amber-300"
                />
              </div>
              <div>
                <Label className="text-[11px] text-amber-800">Chỉ số mới</Label>
                <Input
                  type="number"
                  name="electricityNew"
                  value={elecNew}
                  onChange={(e) => setElecNew(Number(e.target.value))}
                  className="h-8 text-xs bg-white border-amber-400 font-bold text-amber-900"
                />
              </div>
            </div>
          </div>

          {/* Water Section */}
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="flex items-center gap-1">
                <Droplets className="h-4 w-4 text-blue-600" /> Chỉ số Nước (m³)
              </span>
              <span>Sử dụng: <strong className="text-blue-700 font-extrabold">{waterUse} m³</strong></span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-blue-800">Chỉ số cũ</Label>
                <Input
                  type="number"
                  name="waterOld"
                  value={waterOld}
                  onChange={(e) => setWaterOld(Number(e.target.value))}
                  className="h-8 text-xs bg-white border-blue-300"
                />
              </div>
              <div>
                <Label className="text-[11px] text-blue-800">Chỉ số mới</Label>
                <Input
                  type="number"
                  name="waterNew"
                  value={waterNew}
                  onChange={(e) => setWaterNew(Number(e.target.value))}
                  className="h-8 text-xs bg-white border-blue-400 font-bold text-blue-900"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 text-xs shadow-sm">
            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Lưu chỉ số phòng P.{roomCode}
          </Button>
        </form>

        {/* History Table */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <History className="h-4 w-4 text-slate-500" />
            Lịch sử chốt số phòng P.{roomCode}
          </div>

          {loadingHistory ? (
            <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Đang tải lịch sử...
            </div>
          ) : readingsHistory.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">Chưa có lịch sử ghi chỉ số.</p>
          ) : (
            <div className="border rounded-md overflow-hidden text-xs">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="py-2">Kỳ</TableHead>
                    <TableHead className="py-2 text-amber-700">Điện (kWh)</TableHead>
                    <TableHead className="py-2 text-blue-700">Nước (m³)</TableHead>
                    <TableHead className="py-2 text-right">Tổng thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readingsHistory.map((h) => (
                    <TableRow key={h.period}>
                      <TableCell className="font-semibold text-slate-900 py-2">Tháng {h.period}</TableCell>
                      <TableCell className="py-2">
                        <span className="text-slate-500">{h.elecOld} → {h.elecNew}</span>{" "}
                        <strong className="text-amber-600">({h.elecCons})</strong>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-slate-500">{h.waterOld} → {h.waterNew}</span>{" "}
                        <strong className="text-blue-600">({h.waterCons})</strong>
                      </TableCell>
                      <TableCell className="text-right text-emerald-700 font-bold py-2">
                        {formatVND(h.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
