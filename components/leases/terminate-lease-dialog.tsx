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
import { terminateLease } from "@/app/(dashboard)/leases/actions"
import { Loader2 } from "lucide-react"

type TerminateLeaseDialogProps = {
  leaseId: string
  roomId: string
  roomCode: string
  tenantName: string
  trigger: React.ReactNode
}

export function TerminateLeaseDialog({
  leaseId,
  roomId,
  roomCode,
  tenantName,
  trigger,
}: TerminateLeaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isTerminating, setIsTerminating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTerminate = async () => {
    setIsTerminating(true)
    setError(null)
    try {
      const res = await terminateLease(leaseId, roomId)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
      }
    } catch {
      setError("Đã xảy ra lỗi khi thanh lý hợp đồng.")
    } finally {
      setIsTerminating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-amber-600">Xác nhận thanh lý / kết thúc hợp đồng</DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              Bạn có chắc chắn muốn kết thúc hợp đồng thuê của khách <strong>{tenantName}</strong> tại phòng <strong>P.{roomCode}</strong>?
            </p>
            <p className="text-xs text-muted-foreground bg-amber-50 p-2.5 rounded-md border border-amber-200">
              ⚡ Sau khi kết thúc, phòng này sẽ tự động được chuyển về trạng thái <strong>Trống</strong> để sẵn sàng cho khách mới thuê.
            </p>
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
            disabled={isTerminating}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="default"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleTerminate}
            disabled={isTerminating}
          >
            {isTerminating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTerminating ? "Đang xử lý..." : "Xác nhận kết thúc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
