"use client"

import Link from "next/link"
import { PasswordInput } from "@/components/ui/password-input"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginFormProps {
  action: (formData: FormData) => void
}

export function LoginForm({ action }: LoginFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="m@example.com" required />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mật khẩu</Label>
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <PasswordInput id="password" name="password" required />
      </div>
      <SubmitButton className="w-full">Đăng nhập</SubmitButton>
    </form>
  )
}
