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
import { deleteProperty, checkDeleteProperty } from "@/app/(dashboard)/properties/actions"
import { Loader2, AlertCircle } from "lucide-react"

type DeletePropertyDialogProps = {
  propertyId: string
  propertyName: string
  trigger: React.ReactNode
}

export function DeletePropertyDialog({ propertyId, propertyName, trigger }: DeletePropertyDialogProps) {
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
      const res = await checkDeleteProperty(propertyId)
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
    
    const result = await deleteProperty(propertyId)
    
    setIsDeleting(false)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa nhà trọ</DialogTitle>
        </DialogHeader>
        
        {isChecking ? (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {checkResult?.allowed === false ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Không thể xóa khu trọ {propertyName}</p>
                  <p className="text-sm mt-1">{checkResult.reason}</p>
                </div>
              </div>
            ) : (
              <>
                <p>Bạn có chắc chắn muốn xóa nhà trọ <strong>{propertyName}</strong>?</p>
                {(checkResult?.blocking_count?.rooms ?? 0) > 0 && (
                  <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm border border-amber-200">
                    Lưu ý: Khu trọ này đang có <strong>{checkResult?.blocking_count?.rooms}</strong> phòng (có thể là các phòng đã xóa/ẩn). Việc xóa khu trọ sẽ ảnh hưởng đến dữ liệu liên quan.
                  </div>
                )}
                <p className="text-red-500 text-sm">Hành động này không thể hoàn tác.</p>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm font-medium">{error}</div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Đóng
          </Button>
          {!isChecking && checkResult?.allowed !== false && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa nhà trọ"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
