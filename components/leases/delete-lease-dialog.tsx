"use client"

import { useState } from "react"
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
import { deleteLease } from "@/app/(dashboard)/leases/actions"
import { Loader2 } from "lucide-react"

type DeleteLeaseDialogProps = {
  leaseId: string
  roomId: string
  roomCode: string
  tenantName: string
  contractFilePath?: string | null
  trigger: React.ReactNode
}

export function DeleteLeaseDialog({
  leaseId,
  roomId,
  roomCode,
  tenantName,
  contractFilePath,
  trigger,
}: DeleteLeaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await deleteLease(leaseId, roomId, contractFilePath)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
      }
    } catch {
      setError("Đã xảy ra lỗi khi xóa hợp đồng.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Xác nhận xóa hợp đồng</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa bản ghi hợp đồng thuê của khách <strong>{tenantName}</strong> tại phòng <strong>P.{roomCode}</strong>? Hành động này sẽ xóa vĩnh viễn hợp đồng cùng file đính kèm.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Đang xóa..." : "Xóa hợp đồng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
