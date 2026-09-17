"use client"

import { useRef, useState } from "react"
import { signup } from "@/app/(auth)/actions"
import { PasswordInput } from "@/components/ui/password-input"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

export function RegisterForm() {
  const [clientError, setClientError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    setClientError(null)

    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setClientError("Xác nhận mật khẩu không trùng khớp.")
      return
    }

    if (password.length < 6) {
      setClientError("Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }

    await signup(formData)
  }

  return (
    <>
      {clientError && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{clientError}</p>
        </div>
      )}
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input id="fullName" name="fullName" type="text" placeholder="Nguyễn Văn A" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <PasswordInput id="password" name="password" required minLength={6} placeholder="Tối thiểu 6 ký tự" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={6} placeholder="Nhập lại mật khẩu" />
        </div>
        <SubmitButton className="w-full">Đăng ký</SubmitButton>
      </form>
    </>
  )
}
