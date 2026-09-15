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
import { deleteInvoice } from "@/app/(dashboard)/invoices/actions"
import { Loader2 } from "lucide-react"

type DeleteInvoiceDialogProps = {
  invoiceId: string
  roomCode: string
  period: string
  trigger: React.ReactNode
}

export function DeleteInvoiceDialog({
  invoiceId,
  roomCode,
  period,
  trigger,
}: DeleteInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await deleteInvoice(invoiceId)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
      }
    } catch {
      setError("Đã xảy ra lỗi khi xóa hóa đơn.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Xác nhận xóa hóa đơn</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground pt-1">
              Bạn có chắc chắn muốn xóa hóa đơn của phòng <strong>P.{roomCode}</strong> kỳ <strong>{period}</strong>?
              Hành động này sẽ xóa toàn bộ các khoản dịch vụ liên quan và không thể hoàn tác.
            </div>
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
            {isDeleting ? "Đang xóa..." : "Xóa hóa đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}