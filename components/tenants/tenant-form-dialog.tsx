"use client"

import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createTenant, updateTenant } from "@/app/(dashboard)/tenants/actions"
import { Tables } from "@/types/database.types"
import { Loader2 } from "lucide-react"

type TenantFormDialogProps = {
  tenant?: Tables<"tenants"> | null
  trigger: React.ReactNode
}

export function TenantFormDialog({ tenant, trigger }: TenantFormDialogProps) {
  const [open, setOpen] = useState(false)

  const action = tenant ? updateTenant : createTenant
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{tenant ? "Chỉnh sửa thông tin khách thuê" : "Thêm khách thuê mới"}</DialogTitle>
          <DialogDescription>
            Điền các thông tin của khách thuê bên dưới. Nhấn lưu khi hoàn tất.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          {tenant && <input type="hidden" name="id" value={tenant.id} />}

          <div className="space-y-2">
            <Label htmlFor="fullName">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={tenant?.full_name || ""}
              placeholder="VD: Nguyễn Văn An"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Số điện thoại <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={tenant?.phone || ""}
              placeholder="VD: 0912345678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idCardNumber">Số CCCD / CMND</Label>
            <Input
              id="idCardNumber"
              name="idCardNumber"
              defaultValue={tenant?.id_card_number || ""}
              placeholder="VD: 079201001234"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email liên hệ</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={tenant?.email || ""}
              placeholder="VD: nguyenvanan@gmail.com"
            />
          </div>

          {state?.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium">
              {state.error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
