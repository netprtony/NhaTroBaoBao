"use client"

import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createProperty, updateProperty } from "@/app/(dashboard)/properties/actions"
import { Tables } from "@/types/database.types"

type PropertyFormDialogProps = {
  property?: Tables<"properties"> | null
  trigger: React.ReactNode
}

export function PropertyFormDialog({ property, trigger }: PropertyFormDialogProps) {
  const [open, setOpen] = useState(false)
  
  const action = property ? updateProperty : createProperty
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
          <DialogTitle>{property ? "Chỉnh sửa nhà trọ" : "Thêm nhà trọ mới"}</DialogTitle>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4">
          {property && <input type="hidden" name="id" value={property.id} />}
          
          <div className="space-y-2">
            <Label htmlFor="name">Tên nhà trọ</Label>
            <Input id="name" name="name" defaultValue={property?.name || ""} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" name="address" defaultValue={property?.address || ""} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" name="description" defaultValue={property?.description || ""} />
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
