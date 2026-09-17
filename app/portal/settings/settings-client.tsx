"use client"

import { useActionState } from "react"
import { portalChangePassword, portalUpdateProfile } from "@/app/portal/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Key, UserCheck, Loader2 } from "lucide-react"

interface PortalSettingsClientProps {
  tenant: {
    id: string
    full_name: string
    phone: string
    id_card_number: string | null
    email: string | null
  }
}

export function PortalSettingsClient({ tenant }: PortalSettingsClientProps) {
  const [profileState, profileAction, profilePending] = useActionState(portalUpdateProfile, null)
  const [passwordState, passwordAction, passwordPending] = useActionState(portalChangePassword, null)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Update Profile Card */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-400" />
            Hồ sơ cá nhân
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Thông tin định danh khách thuê được liên kết với hợp đồng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            {profileState?.error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                {profileState.error}
              </div>
            )}
            {profileState?.message && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                ✓ {profileState.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300 text-xs">
                Họ và tên
              </Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={tenant.full_name}
                className="bg-slate-950 border-slate-800 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Số điện thoại (đã xác thực)</Label>
              <Input
                value={tenant.phone}
                disabled
                className="bg-slate-950/40 border-slate-800/60 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Số CCCD / CMND</Label>
              <Input
                value={tenant.id_card_number || "Chưa cập nhật"}
                disabled
                className="bg-slate-950/40 border-slate-800/60 text-slate-500 cursor-not-allowed"
              />
            </div>

            <Button
              type="submit"
              disabled={profilePending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9"
            >
              {profilePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi họ tên"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" />
            Đổi mật khẩu Cổng Khách thuê
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Thay đổi mật khẩu đăng nhập để bảo vệ tài khoản cá nhân
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={passwordAction} className="space-y-4">
            {passwordState?.error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                {passwordState.error}
              </div>
            )}
            {passwordState?.message && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                ✓ {passwordState.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-300 text-xs">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300 text-xs">
                Xác nhận mật khẩu mới
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={passwordPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9"
            >
              {passwordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đổi mật khẩu ngay"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
