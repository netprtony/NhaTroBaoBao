"use client"

import { useActionState, useState } from "react"
import { ActionState } from "@/app/portal/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react"

interface PortalLoginFormProps {
  initialError?: string
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function PortalLoginForm({ initialError, action }: PortalLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, pending] = useActionState(action, null)

  const errorMessage = state?.error || initialError

  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-slate-100">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl text-white">Đăng nhập</CardTitle>
        <CardDescription className="text-slate-400">
          Nhập số điện thoại/email và mật khẩu do chủ trọ cung cấp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-400">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="loginIdentifier" className="text-slate-300 text-xs">
              Số điện thoại hoặc Email
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="loginIdentifier"
                name="loginIdentifier"
                placeholder="VD: 0901234567 hoặc email..."
                className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300 text-xs">
              Mật khẩu
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-10 shadow-lg shadow-blue-600/20 transition-all mt-2"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang kiểm tra...
              </>
            ) : (
              "Đăng nhập Cổng Khách thuê"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
