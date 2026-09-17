"use client"

import { useState, useRef } from "react"
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDriveDownload,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  exportAllDataJSON,
  exportRoomsCSV,
  exportInvoicesCSV,
  exportMeterReadingsCSV,
} from "@/lib/backup/backup-restore"
import { restoreFromBackupJSON } from "@/app/(dashboard)/settings/restore-actions"

export function BackupRestoreCard() {
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Tải file sao lưu JSON
  const handleExportJSON = async () => {
    setIsExporting(true)
    setMessage(null)
    try {
      const res = await exportAllDataJSON()
      if (res.error) {
        setMessage({ type: "error", text: res.error })
      } else {
        setMessage({ type: "success", text: "✓ Đã tải file sao lưu JSON về máy thành công!" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi khi sao lưu dữ liệu JSON" })
    } finally {
      setIsExporting(false)
    }
  }

  // 2. Xuất CSV
  const handleExportCSV = async (type: "rooms" | "invoices" | "readings") => {
    setIsExporting(true)
    setMessage(null)
    try {
      if (type === "rooms") await exportRoomsCSV()
      else if (type === "invoices") await exportInvoicesCSV()
      else if (type === "readings") await exportMeterReadingsCSV()

      setMessage({ type: "success", text: "✓ Đã xuất file CSV (Excel) thành công!" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Không thể xuất file CSV" })
    } finally {
      setIsExporting(false)
    }
  }

  // 3. Khôi phục dữ liệu từ file JSON
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setIsRestoring(true)
    setMessage(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      if (json.app !== "BaoBaoStay" || !json.data) {
        throw new Error("File JSON này không phải là định dạng file sao lưu của BaoBao Stay.")
      }

      const res = await restoreFromBackupJSON(json)

      if (res.error) {
        setMessage({ type: "error", text: res.error })
      } else {
        setMessage({ type: "success", text: res.message || "✓ Đã khôi phục dữ liệu thành công!" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "File JSON không hợp lệ." })
    } finally {
      setIsRestoring(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="shadow-sm border bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
              <HardDriveDownload className="h-5 w-5 text-blue-600" />
              Sao lưu & Khôi phục dữ liệu thủ công
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Dành cho tài khoản gói FREE hoặc nhu cầu sao lưu định kỳ ra file JSON/CSV cá nhân.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            An toàn 100%
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Thông báo kết quả */}
        {message && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Khối 1: Sao lưu & Khôi phục file JSON */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileJson className="h-4 w-4 text-indigo-600" />
            <span>1. Sao lưu & Khôi phục toàn bộ (File JSON)</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            File sao lưu JSON chứa đầy đủ danh sách Nhà trọ, Phòng, Khách thuê, Hợp đồng, Hóa đơn và Chỉ số điện nước. Bạn có thể lưu trữ file này trên máy tính để khôi phục bất cứ lúc nào.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              onClick={handleExportJSON}
              disabled={isExporting || isRestoring}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Tải file Sao lưu JSON
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExporting || isRestoring}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs gap-1.5"
            >
              {isRestoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {isRestoring ? "Đang khôi phục..." : "Khôi phục từ file JSON"}
            </Button>
          </div>
        </div>

        {/* Khối 2: Xuất dữ liệu báo cáo ra file Excel / CSV */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>2. Xuất dữ liệu chi tiết ra Excel / CSV</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Xuất dữ liệu mở trực tiếp được trên Microsoft Excel, Google Sheets có tiếng Việt chuẩn UTF-8.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV("rooms")}
              disabled={isExporting}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Danh sách Phòng (.CSV)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV("invoices")}
              disabled={isExporting}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
              Danh sách Hóa đơn (.CSV)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV("readings")}
              disabled={isExporting}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-amber-600" />
              Chỉ số Điện Nước (.CSV)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
