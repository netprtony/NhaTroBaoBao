"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toPng, toBlob } from "html-to-image"
import jsPDF from "jspdf"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Download, Copy, Share2, Check, QrCode, Settings2, Loader2, Building2, ExternalLink, Banknote } from "lucide-react"

export type InvoicePreviewData = {
  id: string
  lease_id: string
  period: string
  rent_amount: number
  electricity_amount: number
  water_amount: number
  other_fees: number
  total_amount: number
  due_date: string
  status: string
  paid_at: string | null
  created_at: string
  lease: {
    room: {
      room_code: string
      property: {
        name: string
        address: string
      }
    }
    tenant: {
      full_name: string
      phone: string
    }
  }
  invoice_items?: Array<{
    id?: string
    label: string
    amount: number
  }>
  meter_readings?: Array<{
    id?: string
    type: "electricity" | "water" | string
    old_value: number
    new_value: number
    consumption?: number | null
    unit_price: number
    total_amount: number
  }>
}

export type OrgPaymentConfig = {
  bank_id?: string | null
  bank_account_no?: string | null
  bank_account_name?: string | null
  show_qr_invoice?: boolean | null
  transfer_template?: string | null
  invoice_notes?: string | null
}

type InvoicePreviewDialogProps = {
  invoice: InvoicePreviewData
  orgName: string
  paymentConfig?: OrgPaymentConfig
  trigger: React.ReactNode
}

// Chuyển đổi số thành chữ tiếng Việt
function readVietnameseNumber(num: number): string {
  if (num === 0) return "Không đồng"
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
  const positions = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"]

  const readThreeDigits = (n: number, showZeroHundred = false): string => {
    const h = Math.floor(n / 100)
    const t = Math.floor((n % 100) / 10)
    const o = n % 10
    let res = ""

    if (h > 0 || showZeroHundred) {
      res += `${units[h]} trăm `
    }

    if (t > 1) {
      res += `${units[t]} mươi `
      if (o === 1) res += "mốt "
      else if (o === 5) res += "lăm "
      else if (o > 0) res += `${units[o]} `
    } else if (t === 1) {
      res += "mười "
      if (o === 5) res += "lăm "
      else if (o > 0) res += `${units[o]} `
    } else if (o > 0) {
      if (h > 0 || showZeroHundred) res += "lẻ "
      res += `${units[o]} `
    }

    return res.trim()
  }

  let temp = Math.abs(num)
  const groups: number[] = []
  while (temp > 0) {
    groups.push(temp % 1000)
    temp = Math.floor(temp / 1000)
  }

  let result = ""
  for (let i = groups.length - 1; i >= 0; i--) {
    const val = groups[i]
    if (val > 0) {
      const showZero = i < groups.length - 1
      const str = readThreeDigits(val, showZero)
      result += `${str} ${positions[i]} `
    }
  }

  result = result.trim()
  result = result.charAt(0).toUpperCase() + result.slice(1) + " đồng"
  return result
}

export function InvoicePreviewDialog({
  invoice,
  orgName,
  paymentConfig,
  trigger,
}: InvoicePreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showBankConfig, setShowBankConfig] = useState(false)

  // Cấu hình thanh toán ngân hàng (ưu tiên từ database organization, fallback sang localStorage)
  const [bankId, setBankId] = useState(paymentConfig?.bank_id || "MB")
  const [accountNo, setAccountNo] = useState(paymentConfig?.bank_account_no || "")
  const [accountName, setAccountName] = useState(paymentConfig?.bank_account_name || "")
  const [showQr, setShowQr] = useState<boolean>(paymentConfig?.show_qr_invoice ?? true)

  useEffect(() => {
    if (paymentConfig) {
      if (paymentConfig.bank_id) setBankId(paymentConfig.bank_id)
      if (paymentConfig.bank_account_no) setAccountNo(paymentConfig.bank_account_no)
      if (paymentConfig.bank_account_name) setAccountName(paymentConfig.bank_account_name)
      if (typeof paymentConfig.show_qr_invoice === "boolean") setShowQr(paymentConfig.show_qr_invoice)
    } else if (typeof window !== "undefined") {
      const savedBank = localStorage.getItem("baobao_bank_id") || "MB"
      const savedAccNo = localStorage.getItem("baobao_bank_no") || ""
      const savedAccName = localStorage.getItem("baobao_bank_name") || ""
      setBankId(savedBank)
      setAccountNo(savedAccNo)
      setAccountName(savedAccName)
    }
  }, [paymentConfig])

  const saveBankConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("baobao_bank_id", bankId)
      localStorage.setItem("baobao_bank_no", accountNo)
      localStorage.setItem("baobao_bank_name", accountName)
      setShowBankConfig(false)
    }
  }

  const receiptRef = useRef<HTMLDivElement>(null)

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  const formatDate = (dStr: string) => {
    try {
      const d = new Date(dStr)
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`
    } catch {
      return dStr
    }
  }

  const roomCode = invoice.lease?.room?.room_code || "---"
  const propertyName = invoice.lease?.room?.property?.name || ""
  const propertyAddress = invoice.lease?.room?.property?.address || ""
  const tenantName = invoice.lease?.tenant?.full_name || "Khách thuê"
  const tenantPhone = invoice.lease?.tenant?.phone || ""

  const elecReading = invoice.meter_readings?.find((r) => r.type === "electricity")
  const waterReading = invoice.meter_readings?.find((r) => r.type === "water")

  // Mẫu cú pháp nội dung chuyển khoản
  const transferContent = paymentConfig?.transfer_template
    ? paymentConfig.transfer_template
        .replace("{room_code}", roomCode)
        .replace("{period}", invoice.period.replace("/", ""))
    : `P${roomCode} T${invoice.period.replace("/", "")}`

  // Mã VietQR động (chỉ render nếu showQr bật và có STK)
  const qrUrl =
    showQr && accountNo.trim()
      ? `https://img.vietqr.io/image/${bankId}-${accountNo.trim()}-compact2.png?amount=${invoice.total_amount}&addInfo=${encodeURIComponent(
          transferContent
        )}&accountName=${encodeURIComponent(accountName)}`
      : null

  // 1. Tải ảnh PNG về máy
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })
      const link = document.createElement("a")
      link.download = `HoaDon_P${roomCode}_Ky_${invoice.period.replace("/", "-")}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Lỗi xuất ảnh:", err)
    } finally {
      setIsExporting(false)
    }
  }

  // 2. Sao chép ảnh vào Clipboard (để dán ngay vào Zalo PC)
  const handleCopyImage = async () => {
    if (!receiptRef.current) return
    setIsExporting(true)
    try {
      const blob = await toBlob(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ "image/png": blob }),
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } else {
        // Fallback tải ảnh nếu clipboard không hỗ trợ
        handleDownloadImage()
      }
    } catch (err) {
      console.error("Lỗi chép ảnh vào clipboard:", err)
    } finally {
      setIsExporting(false)
    }
  }

  // 3. Tải file PDF về máy
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgProps = pdf.getImageProperties(dataUrl)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 297))
      pdf.save(`HoaDon_P${roomCode}_Ky_${invoice.period.replace("/", "-")}.pdf`)
    } catch (err) {
      console.error("Lỗi xuất PDF:", err)
    } finally {
      setIsExporting(false)
    }
  }

  // 4. Gửi trực tiếp qua Zalo (Mobile Share Sheet hoặc mở chat Zalo)
  const handleShareZalo = async () => {
    if (!receiptRef.current) return
    setIsExporting(true)
    try {
      const blob = await toBlob(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], "hoadon.png", { type: "image/png" })] })) {
        const file = new File([blob], `HoaDon_P${roomCode}.png`, { type: "image/png" })
        await navigator.share({
          files: [file],
          title: `Hóa đơn phòng ${roomCode} kỳ ${invoice.period}`,
          text: `Gửi bạn phiếu báo tiền phòng ${roomCode} kỳ ${invoice.period}. Tổng thanh toán: ${formatVND(invoice.total_amount)}.`,
        })
      } else {
        // Sao chép ảnh trước
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new window.ClipboardItem({ "image/png": blob }),
            ])
            setCopied(true)
            setTimeout(() => setCopied(false), 3000)
          } catch {}
        }
        // Mở Zalo chat với số điện thoại khách thuê
        const cleanPhone = tenantPhone.replace(/\D/g, "")
        if (cleanPhone) {
          window.open(`https://zalo.me/${cleanPhone}`, "_blank")
        } else {
          window.open("https://chat.zalo.me", "_blank")
        }
      }
    } catch (err) {
      console.error("Lỗi chia sẻ:", err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              Phiếu thu & Xuất hóa đơn
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Xem trước và tải phiếu báo tiền phòng, chia sẻ qua Zalo
          </DialogDescription>
        </DialogHeader>

        {/* Thanh tùy chọn in mã VietQR & Link Cài đặt */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">In mã VietQR:</span>
            <button
              type="button"
              role="switch"
              aria-checked={showQr}
              onClick={() => setShowQr(!showQr)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                showQr ? "bg-blue-600" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  showQr ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
            <Badge variant={showQr ? "default" : "outline"} className={showQr ? "bg-emerald-600 text-white text-[10px]" : "text-slate-500 text-[10px]"}>
              {showQr ? "Đang bật VietQR" : "Tắt VietQR"}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBankConfig(!showBankConfig)}
              className="h-7 px-2 text-[11px] text-slate-600 hover:text-blue-600"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1" />
              {showBankConfig ? "Đóng sửa STK" : "Sửa STK nhanh"}
            </Button>
            <Link
              href="/settings"
              className="inline-flex items-center text-[11px] text-blue-600 hover:underline px-2 py-1 font-medium"
              target="_blank"
            >
              Cài đặt đầy đủ <ExternalLink className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Form cấu hình ngân hàng nếu bật */}
        {showBankConfig && (
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-sm space-y-3">
            <div className="font-semibold text-blue-900 text-xs uppercase tracking-wide">
              Cài đặt tài khoản nhận chuyển khoản (VietQR)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px] text-blue-800">Ngân hàng (Mã)</Label>
                <Input
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value.toUpperCase())}
                  placeholder="MB, VCB, ACB, TPB..."
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div>
                <Label className="text-[11px] text-blue-800">Số tài khoản</Label>
                <Input
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  placeholder="Ví dụ: 0987654321"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div>
                <Label className="text-[11px] text-blue-800">Chủ tài khoản</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  placeholder="NGUYEN VAN A"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={saveBankConfig}
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Lưu tài khoản
            </Button>
          </div>
        )}

        {/* BẢN IN PHIẾU THU CHÍNH THỨC (REF DOM) */}
        <div className="bg-slate-100 p-2 sm:p-4 rounded-xl overflow-x-auto flex justify-center">
          <div
            ref={receiptRef}
            className="w-full max-w-[560px] bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 text-slate-800 font-sans leading-relaxed"
          >
            {/* Header cơ sở */}
            <div className="flex items-start justify-between border-b pb-4 mb-4">
              <div>
                <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-base tracking-tight">
                  <Building2 className="h-4 w-4" />
                  <span>{orgName}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{propertyName}</div>
                {propertyAddress && (
                  <div className="text-[11px] text-slate-400 mt-0.5">{propertyAddress}</div>
                )}
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 uppercase tracking-wide">
                  HĐ #{invoice.id.substring(0, 8).toUpperCase()}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Ngày lập: {formatDate(invoice.created_at)}
                </div>
              </div>
            </div>

            {/* Tiêu đề chính */}
            <div className="text-center my-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                PHIẾU BÁO TIỀN PHÒNG & DỊCH VỤ
              </h2>
              <div className="text-xs sm:text-sm font-semibold text-blue-600 mt-0.5">
                Kỳ thanh toán: Tháng {invoice.period}
              </div>
            </div>

            {/* Thông tin khách thuê & phòng */}
            <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-xs grid grid-cols-2 gap-2 mb-4">
              <div>
                <span className="text-slate-500">Phòng trọ: </span>
                <strong className="text-slate-900 font-bold">P.{roomCode}</strong>
              </div>
              <div>
                <span className="text-slate-500">Khách thuê: </span>
                <strong className="text-slate-900 font-bold">{tenantName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Số điện thoại: </span>
                <span className="text-slate-700">{tenantPhone || "Chưa cập nhật"}</span>
              </div>
              <div>
                <span className="text-slate-500">Hạn nộp tiền: </span>
                <span className="text-red-600 font-semibold">{formatDate(invoice.due_date)}</span>
              </div>
            </div>

            {/* Bảng kê chi tiết */}
            <div className="border rounded-md overflow-hidden mb-4">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Khoản mục thanh toán</th>
                    <th className="py-2.5 px-3 text-center">Chỉ số (Cũ ➔ Mới) / Số lượng</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Tiền phòng */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      1. Tiền thuê phòng
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      1 tháng
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                      {formatVND(invoice.rent_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatVND(invoice.rent_amount)}
                    </td>
                  </tr>

                  {/* Tiền điện */}
                  {invoice.electricity_amount > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">
                        2. Tiền điện sinh hoạt
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                        {elecReading ? (
                          <div className="space-y-0.5">
                            <span className="inline-block bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              {elecReading.old_value.toLocaleString("vi-VN")} ➔ {elecReading.new_value.toLocaleString("vi-VN")}
                            </span>
                            <div className="text-[10px] text-amber-700 font-bold">
                              (= {(elecReading.consumption ?? Math.max(0, elecReading.new_value - elecReading.old_value)).toLocaleString("vi-VN")} kWh)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                        {elecReading ? `${formatVND(elecReading.unit_price)}/kWh` : "---"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatVND(invoice.electricity_amount)}
                      </td>
                    </tr>
                  )}

                  {/* Tiền nước */}
                  {invoice.water_amount > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">
                        3. Tiền nước sinh hoạt
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                        {waterReading ? (
                          <div className="space-y-0.5">
                            <span className="inline-block bg-cyan-50 text-cyan-900 border border-cyan-200/80 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              {waterReading.old_value.toLocaleString("vi-VN")} ➔ {waterReading.new_value.toLocaleString("vi-VN")}
                            </span>
                            <div className="text-[10px] text-cyan-700 font-bold">
                              (= {(waterReading.consumption ?? Math.max(0, waterReading.new_value - waterReading.old_value)).toLocaleString("vi-VN")} m³)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                        {waterReading ? `${formatVND(waterReading.unit_price)}/m³` : "---"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatVND(invoice.water_amount)}
                      </td>
                    </tr>
                  )}

                  {/* Các phụ phí */}
                  {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                    invoice.invoice_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-700 pl-4">
                          • {item.label}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400 text-[11px]">
                          1 tháng
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600 font-mono text-[11px]">
                          {formatVND(item.amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-800">
                          {formatVND(item.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-blue-50/50 border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 font-bold text-slate-900 text-xs">
                      TỔNG CỘNG THANH TOÁN
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-blue-700 text-sm">
                      {formatVND(invoice.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Số tiền bằng chữ */}
            <div className="text-[11px] text-slate-500 italic mb-4">
              Bằng chữ: <strong className="text-slate-700 not-italic">{readVietnameseNumber(invoice.total_amount)}</strong>
            </div>

            {/* Khu vực VietQR & Thông tin thanh toán */}
            {showQr ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center gap-3">
                {qrUrl ? (
                  <div className="shrink-0 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="VietQR Chuyển khoản"
                      className="w-28 h-28 object-contain rounded border bg-white p-1"
                      crossOrigin="anonymous"
                    />
                    <span className="text-[9px] text-slate-400 block mt-1 font-medium">
                      Quét app ngân hàng
                    </span>
                  </div>
                ) : (
                  <div className="w-28 h-28 border border-dashed rounded flex flex-col items-center justify-center text-center p-2 text-[10px] text-slate-400">
                    <QrCode className="h-6 w-6 text-slate-300 mb-1" />
                    Chưa cấu hình STK
                  </div>
                )}

                <div className="text-xs space-y-1 w-full text-slate-700">
                  <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-blue-700">
                    Thông tin thanh toán chuyển khoản:
                  </div>
                  {accountNo ? (
                    <>
                      <div>Ngân hàng: <strong>{bankId}</strong></div>
                      <div>Số tài khoản: <strong>{accountNo}</strong></div>
                      <div>Chủ tài khoản: <strong>{accountName || "---"}</strong></div>
                      <div className="text-[11px] text-slate-500">
                        Nội dung CK: <strong className="text-blue-600">{transferContent}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 text-[11px] italic">
                      Chủ nhà chưa cấu hình STK. Vui lòng bấm &quot;Cài đặt STK nhận tiền&quot; ở trên để hiển thị mã QR tự động.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-xs text-slate-700">
                  <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-emerald-700">
                    Hình thức thanh toán: Tiền mặt trực tiếp
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Quý khách vui lòng gửi tiền mặt trực tiếp cho người quản lý hoặc chủ trọ khi nhận phiếu thu.
                  </div>
                </div>
              </div>
            )}

            {/* Lời dặn dò & cảm ơn footer */}
            <div className="text-center text-[10px] text-slate-400 mt-4 border-t pt-3">
              {paymentConfig?.invoice_notes ||
                `Xin cảm ơn quý khách! Chúc quý khách an cư lạc nghiệp và có trải nghiệm thoải mái tại ${orgName}.`}
            </div>
          </div>
        </div>

        {/* NÚT THAO TÁC XUẤT ĐA KÊNH */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {/* Tải ảnh PNG */}
          <Button
            type="button"
            variant="outline"
            className="text-xs flex items-center justify-center gap-1.5 border-slate-300"
            onClick={handleDownloadImage}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-blue-600" />}
            Tải ảnh PNG
          </Button>

          {/* Sao chép ảnh vào Clipboard */}
          <Button
            type="button"
            variant="outline"
            className="text-xs flex items-center justify-center gap-1.5 border-slate-300"
            onClick={handleCopyImage}
            disabled={isExporting}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-indigo-600" />}
            {copied ? "Đã chép ảnh!" : "Sao chép ảnh"}
          </Button>

          {/* Tải file PDF */}
          <Button
            type="button"
            variant="outline"
            className="text-xs flex items-center justify-center gap-1.5 border-slate-300"
            onClick={handleDownloadPDF}
            disabled={isExporting}
          >
            <Download className="h-3.5 w-3.5 text-red-600" />
            Tải file PDF
          </Button>

          {/* Gửi qua Zalo */}
          <Button
            type="button"
            className="text-xs flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleShareZalo}
            disabled={isExporting}
          >
            <Share2 className="h-3.5 w-3.5" />
            Gửi qua Zalo
          </Button>
        </div>

        {copied && (
          <div className="p-2.5 rounded-md bg-emerald-50 text-emerald-700 text-xs text-center border border-emerald-200">
            ✓ Đã sao chép ảnh hóa đơn vào Clipboard! Bạn có thể nhấn <strong>Ctrl + V</strong> vào khung chat Zalo để gửi ngay.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}