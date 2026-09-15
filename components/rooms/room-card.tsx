"use client"

import { Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoomFormDialog } from "@/components/rooms/room-form-dialog"
import { DeleteRoomDialog } from "@/components/rooms/delete-room-dialog"
import { Tables } from "@/types/database.types"

type RoomCardProps = {
  room: Tables<"rooms">
}

export function RoomCard({ room }: RoomCardProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "available":
        return { label: "Trống", variant: "default" as const, className: "bg-green-500 hover:bg-green-600" }
      case "occupied":
        return { label: "Đang thuê", variant: "default" as const, className: "bg-blue-500 hover:bg-blue-600" }
      case "maintenance":
        return { label: "Bảo trì", variant: "destructive" as const, className: "bg-amber-500 hover:bg-amber-600" }
      default:
        return { label: "Không xác định", variant: "outline" as const, className: "" }
    }
  }

  const statusInfo = getStatusInfo(room.status || "available")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          {room.room_code}
        </CardTitle>
        <Badge variant={statusInfo.variant} className={statusInfo.className}>
          {statusInfo.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mt-2 space-y-1">
          <div>Diện tích: {room.area ? `${room.area} m²` : "Chưa cập nhật"}</div>
          <div className="text-lg font-semibold text-foreground">
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(room.base_price || 0)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <RoomFormDialog
          propertyId={room.property_id || ""}
          room={room}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
          }
        />
        <DeleteRoomDialog
          roomId={room.id}
          propertyId={room.property_id || ""}
          roomCode={room.room_code}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
      </CardFooter>
    </Card>
  )
}
