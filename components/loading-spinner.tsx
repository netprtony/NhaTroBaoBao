import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingSpinner({
  className,
  size = "md",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("flex items-center justify-center gap-2 text-muted-foreground", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  )
}
