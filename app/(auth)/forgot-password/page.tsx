import Link from "next/link"
import { forgotPassword } from "@/app/(auth)/actions"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
        <CardDescription>
          Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn đường dẫn để đặt lại mật khẩu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {params.error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>{params.error}</p>
          </div>
        )}
        {params.message && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <p>{params.message}</p>
          </div>
        )}
        <form action={forgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
          <SubmitButton className="w-full">Gửi đường dẫn</SubmitButton>
        </form>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm">
          <Link href="/login" className="inline-flex items-center gap-2 font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
