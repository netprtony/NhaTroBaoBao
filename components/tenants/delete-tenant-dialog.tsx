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
import { deleteTenant } from "@/app/(dashboard)/tenants/actions"
import { Loader2 } from "lucide-react"

type DeleteTenantDialogProps = {
  tenantId: string
  tenantName: string
  trigger: React.ReactNode
}

export function DeleteTenantDialog({
  tenantId,
  tenantName,
  trigger,
}: DeleteTenantDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await deleteTenant(tenantId)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
      }
    } catch {
      setError("Đã xảy ra lỗi khi xóa khách thuê.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Xác nhận xóa khách thuê</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa hồ sơ khách thuê <strong>{tenantName}</strong>? Hành động này sẽ xóa toàn bộ dữ liệu liên quan và không thể hoàn tác.
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
            {isDeleting ? "Đang xóa..." : "Xóa khách thuê"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
