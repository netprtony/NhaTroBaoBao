"use client"

import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createRoom, updateRoom } from "@/app/(dashboard)/properties/[propertyId]/actions"
import { Tables } from "@/types/database.types"

type RoomFormDialogProps = {
  propertyId: string
  room?: Tables<"rooms"> | null
  trigger: React.ReactNode
}

export function RoomFormDialog({ propertyId, room, trigger }: RoomFormDialogProps) {
  const [open, setOpen] = useState(false)
  
  const action = room ? updateRoom : createRoom
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? "Chỉnh sửa phòng" : "Thêm phòng mới"}</DialogTitle>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="propertyId" value={propertyId} />
          {room && <input type="hidden" name="id" value={room.id} />}
          
          <div className="space-y-2">
            <Label htmlFor="roomCode">Mã phòng</Label>
            <Input id="roomCode" name="roomCode" defaultValue={room?.room_code || ""} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="area">Diện tích (m²)</Label>
            <Input id="area" name="area" type="number" step="0.01" defaultValue={room?.area || ""} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="basePrice">Giá thuê (VND)</Label>
            <Input id="basePrice" name="basePrice" type="number" defaultValue={room?.base_price || ""} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select name="status" defaultValue={room?.status || "available"}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Trống</SelectItem>
                <SelectItem value="occupied">Đang thuê</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state?.error && (
            <div className="text-red-500 text-sm font-medium">{state.error}</div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang xử lý..." : "Lưu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
