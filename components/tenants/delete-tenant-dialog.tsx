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
import { deleteTenant, checkDeleteTenant } from "@/app/(dashboard)/tenants/actions"
import { Loader2, AlertCircle } from "lucide-react"

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
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkResult, setCheckResult] = useState<{ allowed: boolean, reason: string, blocking_count?: Record<string, number> } | null>(null)

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setIsChecking(true)
      setError(null)
      setCheckResult(null)
      const res = await checkDeleteTenant(tenantId)
      if (res.error) {
        setError(res.error)
      } else if (res.data) {
        setCheckResult(res.data as { allowed: boolean, reason: string, blocking_count?: Record<string, number> })
      }
      setIsChecking(false)
    }
  }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Xác nhận xóa khách thuê</DialogTitle>
        </DialogHeader>

        {isChecking ? (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-2 space-y-4">
            {checkResult?.allowed === false ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Không thể xóa khách thuê {tenantName}</p>
                  <p className="text-sm mt-1">{checkResult.reason}</p>
                </div>
              </div>
            ) : (
              <DialogDescription>
                Bạn có chắc chắn muốn vô hiệu hóa hồ sơ khách thuê <strong>{tenantName}</strong>? Hồ sơ sẽ bị ẩn khỏi danh sách.
              </DialogDescription>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium mt-2">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Đóng
          </Button>
          {!isChecking && checkResult?.allowed !== false && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Đang xóa..." : "Xóa khách thuê"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
