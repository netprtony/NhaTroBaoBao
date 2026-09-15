"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteRoom } from "@/app/(dashboard)/properties/[propertyId]/actions"

type DeleteRoomDialogProps = {
  roomId: string
  propertyId: string
  roomCode: string
  trigger: React.ReactNode
}

export function DeleteRoomDialog({ roomId, propertyId, roomCode, trigger }: DeleteRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    
    const result = await deleteRoom(roomId, propertyId)
    
    setIsDeleting(false)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa phòng</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p>Bạn có chắc chắn muốn xóa phòng <strong>{roomCode}</strong>?</p>
          <p className="text-red-500 mt-2 text-sm">Hành động này không thể hoàn tác.</p>
        </div>

        {error && (
          <div className="text-red-500 text-sm font-medium">{error}</div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
