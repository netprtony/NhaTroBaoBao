"use client"

import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createLease } from "@/app/(dashboard)/leases/actions"
import { Loader2, Upload, FileText } from "lucide-react"

export type SelectableRoom = {
  id: string
  room_code: string
  base_price: number
  status: string
  propertyName: string
}

export type SelectableTenant = {
  id: string
  full_name: string
  phone: string
}

type LeaseFormDialogProps = {
  rooms: SelectableRoom[]
  tenants: SelectableTenant[]
  trigger: React.ReactNode
}

export function LeaseFormDialog({ rooms, tenants, trigger }: LeaseFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [monthlyRent, setMonthlyRent] = useState<number | string>("")
  const [deposit, setDeposit] = useState<number | string>("")
  const [fileName, setFileName] = useState<string>("")

  // Default dates: start = today, end = 6 months later
  const todayStr = new Date().toISOString().split("T")[0]
  const sixMonthsLater = new Date()
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
  const defaultEndStr = sixMonthsLater.toISOString().split("T")[0]

  const [state, formAction, isPending] = useActionState(createLease, null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      // reset form
      setSelectedRoomId("")
      setSelectedTenantId("")
      setMonthlyRent("")
      setDeposit("")
      setFileName("")
    }
  }, [state])

  // Khi chọn phòng, tự động gán giá thuê cơ bản & tiền cọc = 1 tháng
  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId)
    const room = rooms.find((r) => r.id === roomId)
    if (room) {
      setMonthlyRent(room.base_price)
      setDeposit(room.base_price) // Gợi ý cọc 1 tháng
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo hợp đồng thuê mới</DialogTitle>
          <DialogDescription>
            Chọn phòng, khách thuê và thời hạn thuê. Sau khi tạo, phòng sẽ tự động chuyển sang trạng thái Đang thuê.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          {/* Chọn phòng */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="roomId">
                Phòng thuê <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs">
                {rooms.length > 0 ? (
                  <span className="text-blue-600 font-medium">({rooms.length} phòng trống khả dụng)</span>
                ) : (
                  <span className="text-amber-600 font-medium">(Hết phòng trống)</span>
                )}
              </span>
            </div>
            <input type="hidden" name="roomId" value={selectedRoomId} />
            <Select value={selectedRoomId} onValueChange={handleRoomChange} disabled={rooms.length === 0}>
              <SelectTrigger>
                <SelectValue
                  placeholder={rooms.length === 0 ? "-- Hết phòng trống --" : "-- Chọn phòng còn trống --"}
                />
              </SelectTrigger>
              <SelectContent>
                {rooms.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Không có phòng trống nào
                  </SelectItem>
                ) : (
                  rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.propertyName} - P.{room.room_code} ({new Intl.NumberFormat("vi-VN").format(room.base_price)} đ/tháng)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {rooms.length === 0 && (
              <p className="text-xs text-amber-600">
                Toàn bộ các phòng hiện đã có khách thuê hoặc đang bảo trì. Vui lòng thêm phòng mới hoặc kiểm tra lại trạng thái phòng.
              </p>
            )}
          </div>

          {/* Chọn khách thuê */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tenantId">
                Khách thuê đại diện <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs">
                {tenants.length > 0 ? (
                  <span className="text-blue-600 font-medium">({tenants.length} khách thuê sẵn sàng)</span>
                ) : (
                  <span className="text-amber-600 font-medium">(Không có khách thuê khả dụng)</span>
                )}
              </span>
            </div>
            <input type="hidden" name="tenantId" value={selectedTenantId} />
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId} disabled={tenants.length === 0}>
              <SelectTrigger>
                <SelectValue
                  placeholder={tenants.length === 0 ? "-- Không có khách khả dụng --" : "-- Chọn khách thuê --"}
                />
              </SelectTrigger>
              <SelectContent>
                {tenants.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Chưa có khách thuê khả dụng
                  </SelectItem>
                ) : (
                  tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.full_name} ({tenant.phone})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {tenants.length === 0 && (
              <p className="text-xs text-amber-600">
                Tất cả khách thuê hiện tại đều đang đứng tên hợp đồng hiệu lực. Vui lòng thêm khách thuê mới trước khi tạo hợp đồng.
              </p>
            )}
          </div>

          {/* Ngày bắt đầu & kết thúc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Ngày bắt đầu thuê <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={todayStr}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                Ngày hết hạn hợp đồng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={defaultEndStr}
                required
              />
            </div>
          </div>

          {/* Giá thuê & Tiền cọc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">
                Giá thuê hàng tháng (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monthlyRent"
                name="monthlyRent"
                type="number"
                min="0"
                step="50000"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                placeholder="VD: 3000000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Tiền đặt cọc (VNĐ)</Label>
              <Input
                id="deposit"
                name="deposit"
                type="number"
                min="0"
                step="50000"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="VD: 3000000"
              />
            </div>
          </div>

          {/* File hợp đồng đính kèm */}
          <div className="space-y-2">
            <Label htmlFor="contractFile">File hợp đồng ký kết (PDF hoặc Ảnh)</Label>
            <div className="border border-dashed rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
              <input
                id="contractFile"
                name="contractFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFileName(file.name)
                }}
              />
              <label
                htmlFor="contractFile"
                className="cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                {fileName ? (
                  <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                    <FileText className="h-5 w-5" />
                    <span className="truncate max-w-[280px]">{fileName}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium text-slate-700">
                      Bấm để chọn file hợp đồng tải lên
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Hỗ trợ PDF, JPG, PNG tối đa 10MB
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {state?.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium">
              {state.error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedRoomId || !selectedTenantId || rooms.length === 0 || tenants.length === 0}
              className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending
                ? "Đang tạo hợp đồng..."
                : rooms.length === 0
                ? "Hết phòng trống"
                : tenants.length === 0
                ? "Không có khách khả dụng"
                : "Tạo hợp đồng"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
