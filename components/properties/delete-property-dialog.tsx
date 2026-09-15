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
import { deleteProperty } from "@/app/(dashboard)/properties/actions"

type DeletePropertyDialogProps = {
  propertyId: string
  propertyName: string
  trigger: React.ReactNode
}

export function DeletePropertyDialog({ propertyId, propertyName, trigger }: DeletePropertyDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa nhà trọ</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p>Bạn có chắc chắn muốn xóa nhà trọ <strong>{propertyName}</strong>?</p>
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
