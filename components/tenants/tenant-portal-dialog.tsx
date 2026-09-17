"use client"

import { useActionState, useState } from "react"
import { Tables } from "@/types/database.types"
import { toggleTenantPortalAccess } from "@/app/(dashboard)/tenants/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

interface TenantPortalDialogProps {
  tenant: Tables<"tenants">
  trigger?: React.ReactNode
}

export function TenantPortalDialog({ tenant, trigger }: TenantPortalDialogProps) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")

  const loginUsername = tenant.email?.trim() || tenant.phone

  const [state, formAction, pending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const res = await toggleTenantPortalAccess(prevState as { error?: string }, formData)
      if (res.success) {
        setOpen(false)
        setPassword("")
      }
      return res
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cổng khách thuê
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
            Tài khoản Cổng Khách thuê
          </DialogTitle>
          <DialogDescription>
            Cấp quyền đăng nhập cổng thông tin xem hợp đồng, hóa đơn và báo chỉ số điện nước cho khách thuê{" "}
            <span className="font-semibold text-slate-800">{tenant.full_name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 py-2">
          <input type="hidden" name="tenantId" value={tenant.id} />

          {/* Current Portal Status */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Trạng thái cổng thông tin</span>
              {tenant.portal_enabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đã kích hoạt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  <XCircle className="h-3.5 w-3.5" /> Chưa kích hoạt
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
              <p>
                <strong className="text-slate-700">Định danh đăng nhập:</strong> {loginUsername}
              </p>
              <p className="text-slate-500">
                Khách thuê sử dụng SĐT hoặc Email trên để đăng nhập tại trang <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">/portal/login</code>.
              </p>
            </div>
          </div>

          {state?.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {state.error}
            </div>
          )}

          {!tenant.auth_user_id || !tenant.portal_enabled ? (
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu khởi tạo cho khách thuê</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập ít nhất 6 ký tự..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input type="hidden" name="actionType" value="enable" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="password">Cập nhật/Reset mật khẩu mới (tùy chọn)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu mới nếu muốn đổi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <input type="hidden" name="actionType" value="enable" />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            {tenant.portal_enabled && (
              <Button
                type="submit"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  const form = document.querySelector("form")
                  if (form) {
                    const input = form.querySelector("input[name='actionType']") as HTMLInputElement
                    if (input) input.value = "disable"
                  }
                }}
              >
                Vô hiệu hóa cổng
              </Button>
            )}
            <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700">
              {pending ? "Đang xử lý..." : tenant.portal_enabled ? "Cập nhật tài khoản" : "Kích hoạt cổng thông tin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
