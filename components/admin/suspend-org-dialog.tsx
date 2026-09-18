"use client"

import { useActionState, useState } from "react"
import { AlertTriangle, Lock, Unlock, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toggleOrgSuspensionAction, type ActionState } from "@/app/admin/actions"

interface SuspendOrgDialogProps {
  orgId: string
  orgName: string
  isSuspended: boolean
  currentReason?: string | null
  trigger?: React.ReactNode
}

export function SuspendOrgDialog({
  orgId,
  orgName,
  isSuspended,
  currentReason,
  trigger,
}: SuspendOrgDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const res = await toggleOrgSuspensionAction(prev, formData)
    if (res?.success) {
      setOpen(false)
    }
    return res
  }, null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant={isSuspended ? "outline" : "destructive"}
            className="gap-1.5 text-xs"
          >
            {isSuspended ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-emerald-400" /> Mở khóa
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" /> Tạm khóa
              </>
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="actionType" value={isSuspended ? "unsuspend" : "suspend"} />

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-white">
              {isSuspended ? (
                <>
                  <Unlock className="h-5 w-5 text-emerald-400" /> Mở khóa Tổ chức
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-rose-500" /> XÁC NHẬN TẠM KHÓA TỔ CHỨC
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              Tổ chức: <strong className="text-white">{orgName}</strong>
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {state.error}
            </div>
          )}

          {!isSuspended ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Khi bị khóa, toàn bộ tài khoản chủ trọ và nhân viên thuộc tổ chức này sẽ không thể truy cập vào hệ thống dashboard quản lý nhà trọ.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs font-semibold text-slate-200">
                  Lý do khóa tổ chức <span className="text-rose-400">*</span>
                </Label>
                <Textarea
                  id="reason"
                  name="reason"
                  required
                  rows={3}
                  placeholder="Nhập chi tiết lý do (VD: Hết hạn hợp đồng dịch vụ SaaS, Vi phạm quy định...)"
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <p className="text-slate-300">
                Tổ chức này hiện đang bị khóa với lý do:
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 italic">
                &ldquo;{currentReason || "Không có lý do cụ thể"}&rdquo;
              </div>
              <p className="text-slate-400">
                Bạn có chắc chắn muốn khôi phục lại quyền truy cập hệ thống cho tổ chức này?
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              variant={isSuspended ? "default" : "destructive"}
              className={isSuspended ? "bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5" : "text-xs gap-1.5"}
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSuspended ? "Khôi phục truy cập" : "Tạm khóa ngay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
