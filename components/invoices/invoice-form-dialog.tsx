"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createInvoice,
  updateInvoice,
  getLatestMeterReadings,
  getInvoicedLeaseIds,
  type InvoiceItemInput,
} from "@/app/(dashboard)/invoices/actions"
import { Plus, Trash2, Zap, Droplets, Sparkles, Loader2, CheckCircle2 } from "lucide-react"

export type ActiveLeaseOption = {
  id: string
  room_id: string
  monthly_rent: number
  room: {
    room_code: string
    property: {
      name: string
    }
  }
  tenant: {
    id: string
    full_name: string
    phone: string
  }
}

export type InvoiceData = {
  id: string
  lease_id: string
  period: string
  rent_amount: number
  electricity_amount: number
  water_amount: number
  other_fees: number
  total_amount: number
  due_date: string
  status: string
  invoice_items?: Array<{
    id?: string
    label: string
    amount: number
  }>
}

type InvoiceFormDialogProps = {
  activeLeases?: ActiveLeaseOption[]
  existingInvoices?: Array<{
    id?: string
    lease_id: string
    period: string
    status: string
  }>
  invoice?: InvoiceData | null
  trigger: React.ReactNode
}

// Preset gợi ý nhanh các khoản phụ phí phổ biến tại nhà trọ Việt Nam
const COMMON_PRESETS = [
  { label: "Tiền Wifi", amount: 100000 },
  { label: "Tiền rác", amount: 30000 },
  { label: "Gửi xe máy", amount: 100000 },
  { label: "Phí dịch vụ chung", amount: 50000 },
  { label: "Tiền giặt ủi", amount: 50000 },
]

export function InvoiceFormDialog({
  activeLeases = [],
  existingInvoices = [],
  invoice,
  trigger,
}: InvoiceFormDialogProps) {
  const isEditing = !!invoice
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(invoice?.lease_id || "")
  
  // Mặc định kỳ hiện tại (Tháng MM/YYYY)
  const getCurrentPeriod = () => {
    const d = new Date()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    return `${month}/${d.getFullYear()}`
  }

  // Mặc định ngày hạn nộp (7 ngày sau)
  const getDefaultDueDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split("T")[0]
  }

  const [period, setPeriod] = useState<string>(invoice?.period || getCurrentPeriod())
  const [dueDate, setDueDate] = useState<string>(invoice?.due_date || getDefaultDueDate())
  const [rentAmount, setRentAmount] = useState<number>(invoice?.rent_amount || 0)
  const [status, setStatus] = useState<string>(invoice?.status || "pending")

  // Trạng thái tải dữ liệu
  const [isLoadingReadings, setIsLoadingReadings] = useState(false)
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)

  // Danh sách lease_id đã có hóa đơn trong kỳ này
  const [invoicedLeaseIds, setInvoicedLeaseIds] = useState<string[]>(() => {
    if (!existingInvoices || existingInvoices.length === 0) return []
    const cleanPeriod = (invoice?.period || getCurrentPeriod()).trim()
    return existingInvoices
      .filter((inv) => inv.period === cleanPeriod && inv.status !== "cancelled")
      .map((inv) => inv.lease_id)
  })

  // Đồng bộ danh sách các phòng đã lập hóa đơn theo kỳ thu tiền
  useEffect(() => {
    if (isEditing || !open) return

    const cleanPeriod = period.trim()
    if (!cleanPeriod) {
      setInvoicedLeaseIds([])
      return
    }

    // 1. Đồng bộ ngay tức thì từ existingInvoices (zero latency)
    if (existingInvoices && existingInvoices.length > 0) {
      const propIds = existingInvoices
        .filter((inv) => inv.period === cleanPeriod && inv.status !== "cancelled")
        .map((inv) => inv.lease_id)
      setInvoicedLeaseIds(propIds)
    }

    // 2. Fetch từ server action để chắc chắn 100% dữ liệu mới nhất
    let active = true
    setIsLoadingAvailability(true)
    getInvoicedLeaseIds(cleanPeriod)
      .then((serverIds) => {
        if (active) {
          setInvoicedLeaseIds(serverIds)
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingAvailability(false)
        }
      })

    return () => {
      active = false
    }
  }, [period, open, isEditing, existingInvoices])

  // Lọc chỉ những phòng / hợp đồng chưa lập hóa đơn trong kỳ này
  const availableLeases = useMemo(() => {
    if (isEditing) return activeLeases
    const billedSet = new Set(invoicedLeaseIds)
    return activeLeases.filter((l) => !billedSet.has(l.id))
  }, [activeLeases, invoicedLeaseIds, isEditing])

  // Nếu phòng đang chọn không còn nằm trong danh sách có thể lập hóa đơn của kỳ này -> reset
  useEffect(() => {
    if (!isEditing && selectedLeaseId) {
      const isStillAvailable = availableLeases.some((l) => l.id === selectedLeaseId)
      if (!isStillAvailable) {
        setSelectedLeaseId("")
        setRentAmount(0)
        setElecOld(0)
        setElecNew(0)
        setWaterOld(0)
        setWaterNew(0)
        setCalcElectricity(false)
        setCalcWater(false)
      }
    }
  }, [availableLeases, isEditing, selectedLeaseId])

  // Điện
  const [calcElectricity, setCalcElectricity] = useState(false)
  const [elecOld, setElecOld] = useState<number>(0)
  const [elecNew, setElecNew] = useState<number>(0)
  const [elecPrice, setElecPrice] = useState<number>(3500)
  const [electricityAmount, setElectricityAmount] = useState<number>(invoice?.electricity_amount || 0)

  // Nước
  const [calcWater, setCalcWater] = useState(false)
  const [waterOld, setWaterOld] = useState<number>(0)
  const [waterNew, setWaterNew] = useState<number>(0)
  const [waterPrice, setWaterPrice] = useState<number>(15000)
  const [waterAmount, setWaterAmount] = useState<number>(invoice?.water_amount || 0)

  // Dynamic invoice items (wifi, rác, xe,...)
  const [items, setItems] = useState<InvoiceItemInput[]>(
    invoice?.invoice_items && invoice.invoice_items.length > 0
      ? invoice.invoice_items.map((it) => ({ label: it.label, amount: it.amount }))
      : [
          { label: "Tiền Wifi", amount: 100000 },
          { label: "Tiền rác", amount: 30000 },
        ]
  )

  // Tự động tính tiền điện theo chỉ số
  useEffect(() => {
    if (calcElectricity) {
      const diff = Math.max(0, elecNew - elecOld)
      setElectricityAmount(diff * elecPrice)
    }
  }, [calcElectricity, elecOld, elecNew, elecPrice])

  // Tự động tính tiền nước theo chỉ số
  useEffect(() => {
    if (calcWater) {
      const diff = Math.max(0, waterNew - waterOld)
      setWaterAmount(diff * waterPrice)
    }
  }, [calcWater, waterOld, waterNew, waterPrice])

  // Khi chọn hợp đồng -> tự động điền tiền thuê và lấy chỉ số cũ gần nhất
  const handleLeaseChange = async (leaseId: string) => {
    setSelectedLeaseId(leaseId)
    const target = activeLeases.find((l) => l.id === leaseId)
    if (target) {
      setRentAmount(target.monthly_rent)

      // Tự động lấy chỉ số cũ gần nhất của phòng từ bảng meter_readings
      setIsLoadingReadings(true)
      try {
        const readings = await getLatestMeterReadings(target.room_id)
        setElecOld(readings.electricityOld)
        setWaterOld(readings.waterOld)
        setElecPrice(readings.electricityPrice)
        setWaterPrice(readings.waterPrice)

        // Bật sẵn chế độ nhập chỉ số mới (chỉ số cũ đã tự động điền)
        setCalcElectricity(true)
        setCalcWater(true)
      } finally {
        setIsLoadingReadings(false)
      }
    }
  }

  // Khi thay đổi kỳ thu tiền
  const handlePeriodChange = (val: string) => {
    setPeriod(val)
  }

  // Thêm mục dịch vụ mới
  const handleAddItem = (label = "", amount = 0) => {
    setItems((prev) => [...prev, { label, amount }])
  }

  // Xóa mục dịch vụ
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Cập nhật giá trị mục dịch vụ
  const handleUpdateItem = (index: number, field: "label" | "amount", value: string | number) => {
    setItems((prev) => {
      const updated = [...prev]
      if (field === "amount") {
        updated[index].amount = Number(value) || 0
      } else {
        updated[index].label = String(value)
      }
      return updated
    })
  }

  // Bấm gợi ý nhanh 1-click
  const handleApplyPreset = (preset: { label: string; amount: number }) => {
    const existingIndex = items.findIndex((it) => it.label.toLowerCase() === preset.label.toLowerCase())
    if (existingIndex >= 0) {
      handleUpdateItem(existingIndex, "amount", preset.amount)
    } else {
      handleAddItem(preset.label, preset.amount)
    }
  }

  // Tính tổng
  const totalOtherFees = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
  const grandTotal = Number(rentAmount || 0) + Number(electricityAmount || 0) + Number(waterAmount || 0) + totalOtherFees

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedLeaseId) {
      setError("Vui lòng chọn phòng / khách thuê.")
      return
    }

    if (!period.trim()) {
      setError("Vui lòng nhập kỳ hóa đơn (ví dụ: 09/2026).")
      return
    }

    if (!dueDate) {
      setError("Vui lòng chọn hạn thanh toán.")
      return
    }

    setIsSubmitting(true)

    try {
      const selectedLease = activeLeases.find((l) => l.id === selectedLeaseId)
      const roomId = selectedLease?.room_id || ""

      // Dữ liệu chỉ số ghi nhận vào bảng meter_readings
      const meterReadingData =
        (calcElectricity || calcWater) && roomId
          ? {
              roomId,
              electricity: calcElectricity
                ? { old: elecOld, new: elecNew, price: elecPrice }
                : undefined,
              water: calcWater
                ? { old: waterOld, new: waterNew, price: waterPrice }
                : undefined,
            }
          : undefined

      if (isEditing && invoice) {
        const res = await updateInvoice({
          invoiceId: invoice.id,
          period: period.trim(),
          rentAmount,
          electricityAmount,
          waterAmount,
          otherFees: totalOtherFees,
          totalAmount: grandTotal,
          dueDate,
          status,
          items,
          meterReadingData,
        })
        if (res.error) {
          setError(res.error)
        } else {
          setOpen(false)
        }
      } else {
        const res = await createInvoice({
          leaseId: selectedLeaseId,
          period: period.trim(),
          rentAmount,
          electricityAmount,
          waterAmount,
          otherFees: totalOtherFees,
          totalAmount: grandTotal,
          dueDate,
          status,
          items,
          meterReadingData,
        })
        if (res.error) {
          setError(res.error)
        } else {
          setOpen(false)
        }
      }
    } catch {
      setError("Đã xảy ra lỗi khi lưu hóa đơn.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {isEditing ? "Chỉnh sửa hóa đơn" : "Lập hóa đơn thu tiền"}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              Tạo phiếu báo tiền phòng, điện nước và các khoản phụ phí dịch vụ hàng tháng.
            </div>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Thông tin chung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kỳ thu tiền */}
            <div className="space-y-1.5">
              <Label htmlFor="period">
                Kỳ thu tiền <span className="text-red-500">*</span>
              </Label>
              <Input
                id="period"
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                placeholder="Ví dụ: 09/2026"
                required
                disabled={isEditing}
              />
            </div>

            {/* Hạn thanh toán */}
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">
                Hạn thanh toán <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            {/* Phòng / Hợp đồng thuê - Chỉ hiển thị các phòng có thể lập hóa đơn theo kỳ thu tiền */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <Label htmlFor="leaseId">
                  Phòng / Hợp đồng thuê <span className="text-red-500">*</span>
                </Label>
                {!isEditing && (
                  <span className="text-xs">
                    {isLoadingAvailability ? (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Đang kiểm tra phòng khả dụng...
                      </span>
                    ) : availableLeases.length > 0 ? (
                      <span className="text-blue-600 font-medium">
                        (Còn {availableLeases.length}/{activeLeases.length} phòng có thể lập hóa đơn kỳ {period})
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">
                        (Đã lập hóa đơn cho toàn bộ {activeLeases.length} phòng kỳ {period})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="p-2.5 rounded-md bg-slate-100 text-sm font-medium text-slate-800 border">
                  Hóa đơn #{invoice?.id.substring(0, 8)}
                </div>
              ) : (
                <Select
                  value={selectedLeaseId}
                  onValueChange={handleLeaseChange}
                  disabled={availableLeases.length === 0}
                >
                  <SelectTrigger id="leaseId">
                    <SelectValue
                      placeholder={
                        availableLeases.length === 0
                          ? `-- Tất cả phòng đã lập hóa đơn kỳ ${period} --`
                          : "-- Chọn phòng / khách thuê --"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLeases.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        Phòng {l.room.room_code} - {l.tenant.full_name} ({l.room.property.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Thông báo thân thiện khi tất cả các phòng đã được lập hóa đơn trong kỳ này */}
              {!isEditing && availableLeases.length === 0 && (
                <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2 mt-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Toàn bộ <strong>{activeLeases.length} phòng</strong> đang thuê đều đã được lập hóa đơn trong kỳ <strong>{period}</strong>. Bạn có thể thay đổi ô <strong>Kỳ thu tiền</strong> ở trên nếu muốn lập hóa đơn cho kỳ khác.
                  </span>
                </div>
              )}
            </div>

            {isLoadingReadings && (
              <div className="sm:col-span-2 text-xs text-blue-600 flex items-center gap-1.5 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tự động lấy chỉ số điện nước gần nhất của phòng...
              </div>
            )}
          </div>

          {/* Tiền phòng */}
          <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rentAmount" className="font-semibold text-blue-900">
                1. Tiền thuê phòng (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <span className="text-sm font-bold text-blue-700">{formatVND(rentAmount)}</span>
            </div>
            <Input
              id="rentAmount"
              type="number"
              min={0}
              step={10000}
              value={rentAmount || ""}
              onChange={(e) => setRentAmount(Number(e.target.value) || 0)}
              required
            />
          </div>

          {/* Tiền điện */}
          <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <Label htmlFor="electricityAmount" className="font-semibold text-amber-900">
                  2. Tiền điện (VNĐ)
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                onClick={() => setCalcElectricity(!calcElectricity)}
              >
                {calcElectricity ? "Nhập số tiền trực tiếp" : "⚡ Tính theo chỉ số điện"}
              </Button>
            </div>

            {calcElectricity ? (
              <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-md border border-amber-200">
                <div>
                  <label className="text-[11px] text-gray-500 block">Số cũ (kWh)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={elecOld || ""}
                    onChange={(e) => setElecOld(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block">Số mới (kWh)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={elecNew || ""}
                    onChange={(e) => setElecNew(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block">Đơn giá (đ/kWh)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={elecPrice}
                    onChange={(e) => setElecPrice(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3 text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded border border-amber-200">
                  ⚡ Chỉ số cũ (<strong>{elecOld} kWh</strong>) được tự động lấy từ kỳ gần nhất (mặc định 0). Bạn chỉ cần nhập <strong>Số mới</strong>.
                </div>
                <div className="col-span-3 text-xs text-amber-800 pt-1 flex justify-between">
                  <span>Tiêu thụ: <strong>{Math.max(0, elecNew - elecOld)} kWh</strong></span>
                  <span>Thành tiền: <strong>{formatVND(electricityAmount)}</strong></span>
                </div>
              </div>
            ) : (
              <Input
                id="electricityAmount"
                type="number"
                min={0}
                step={5000}
                value={electricityAmount || ""}
                onChange={(e) => setElectricityAmount(Number(e.target.value) || 0)}
              />
            )}
          </div>

          {/* Tiền nước */}
          <div className="p-3.5 rounded-lg bg-cyan-50/50 border border-cyan-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-600" />
                <Label htmlFor="waterAmount" className="font-semibold text-cyan-900">
                  3. Tiền nước (VNĐ)
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-cyan-700 hover:text-cyan-800 hover:bg-cyan-100"
                onClick={() => setCalcWater(!calcWater)}
              >
                {calcWater ? "Nhập số tiền trực tiếp" : "💧 Tính theo chỉ số m³"}
              </Button>
            </div>

            {calcWater ? (
              <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-md border border-cyan-200">
                <div>
                  <label className="text-[11px] text-gray-500 block">Số cũ (m³)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={waterOld || ""}
                    onChange={(e) => setWaterOld(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block">Số mới (m³)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={waterNew || ""}
                    onChange={(e) => setWaterNew(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block">Đơn giá (đ/m³)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={waterPrice}
                    onChange={(e) => setWaterPrice(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3 text-[11px] text-cyan-800 bg-cyan-100/60 p-2 rounded border border-cyan-200">
                  💧 Chỉ số cũ (<strong>{waterOld} m³</strong>) được tự động lấy từ kỳ gần nhất (mặc định 0). Bạn chỉ cần nhập <strong>Số mới</strong>.
                </div>
                <div className="col-span-3 text-xs text-cyan-800 pt-1 flex justify-between">
                  <span>Tiêu thụ: <strong>{Math.max(0, waterNew - waterOld)} m³</strong></span>
                  <span>Thành tiền: <strong>{formatVND(waterAmount)}</strong></span>
                </div>
              </div>
            ) : (
              <Input
                id="waterAmount"
                type="number"
                min={0}
                step={5000}
                value={waterAmount || ""}
                onChange={(e) => setWaterAmount(Number(e.target.value) || 0)}
              />
            )}
          </div>

          {/* Phụ phí dịch vụ (invoice_items) */}
          <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <Label className="font-semibold text-purple-900">
                  4. Dịch vụ & Phụ phí kèm theo
                </Label>
              </div>
              <span className="text-xs font-bold text-purple-700">
                Tổng phụ phí: {formatVND(totalOtherFees)}
              </span>
            </div>

            {/* Quick Presets 1-Click */}
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1.5 font-medium">
                Gợi ý thêm nhanh (Bấm 1 chạm):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="inline-flex items-center gap-1 text-xs bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-full shadow-sm transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {preset.label} ({formatVND(preset.amount)})
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách các item */}
            <div className="space-y-2 pt-1">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Tên khoản thu (vd: Tiền Wifi, Tiền rác...)"
                    value={item.label}
                    onChange={(e) => handleUpdateItem(index, "label", e.target.value)}
                    className="flex-1 bg-white h-9 text-sm"
                  />
                  <div className="w-36">
                    <Input
                      type="number"
                      min={0}
                      step={5000}
                      placeholder="Số tiền (VNĐ)"
                      value={item.amount || ""}
                      onChange={(e) => handleUpdateItem(index, "amount", e.target.value)}
                      className="bg-white h-9 text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddItem()}
                className="w-full mt-2 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Thêm dòng phụ phí khác
              </Button>
            </div>
          </div>

          {/* Trạng thái nếu đang chỉnh sửa */}
          {isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Trạng thái thanh toán</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chưa thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* TỔNG CỘNG THANH TOÁN */}
          <div className="rounded-lg bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                Tổng cộng cần thanh toán
              </span>
              <span className="text-xs text-slate-300">
                (Phòng + Điện + Nước + {items.length} dịch vụ kèm theo)
              </span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {formatVND(grandTotal)}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]"
              disabled={isSubmitting || (!isEditing && availableLeases.length === 0)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isEditing && availableLeases.length === 0
                ? "Không có phòng cần lập"
                : isEditing
                ? "Cập nhật hóa đơn"
                : "Lưu hóa đơn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}