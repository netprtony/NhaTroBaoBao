"use client"

import { useFormStatus } from "react-dom"
import { Button, ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function SubmitButton({ children, className, ...props }: ButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
