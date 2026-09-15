"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getContractDownloadUrl } from "@/app/(dashboard)/leases/actions"
import { FileText, Loader2 } from "lucide-react"

export function ContractFileButton({ filePath }: { filePath: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenFile = async () => {
    setIsLoading(true)
    try {
      const res = await getContractDownloadUrl(filePath)
      if (res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer")
      } else {
        alert(res.error || "Không tìm thấy file hợp đồng.")
      }
    } catch {
      alert("Đã xảy ra lỗi khi mở file.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
      onClick={handleOpenFile}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-blue-600" />
      )}
      {isLoading ? "Đang mở..." : "Xem file hợp đồng"}
    </Button>
  )
}
