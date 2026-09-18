"use client"

import { useState } from "react"
import {
  Crown,
  Sparkles,
  CheckCircle2,
  Copy,
  QrCode,
  CreditCard,
  Loader2,
  Zap,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  createSubscriptionOrder,
  confirmSimulatedPayment,
  cancelPendingOrder,
  type SubscriptionOrderResult,
} from "@/app/(dashboard)/settings/billing-actions"
import {
  formatVND,
  PLAN_PRICES,
  PLATFORM_BANK_INFO,
  type BillingCycle,
  type PaymentMethod,
} from "@/lib/payment/vnpay"

type CheckoutDialogProps = {
  initialPlan?: "basic" | "vip"
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CheckoutDialog({
  initialPlan = "basic",
  trigger,
  open: customOpen,
  onOpenChange: customOnOpenChange,
}: CheckoutDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = customOpen !== undefined
  const isOpen = isControlled ? customOpen : internalOpen

  const setOpen = (val: boolean) => {
    if (customOnOpenChange) customOnOpenChange(val)
    else setInternalOpen(val)
  }

  const [step, setStep] = useState<"select" | "pay">("select")
  const [plan, setPlan] = useState<"basic" | "vip">(initialPlan)
  const [cycle, setCycle] = useState<BillingCycle>("yearly")
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [orderResult, setOrderResult] = useState<SubscriptionOrderResult | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleStartPayment = async () => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      const res = await createSubscriptionOrder(plan, cycle, method)
      if (res.error) {
        setMessage({ type: "error", text: res.error })
      } else {
        setOrderResult(res)
        setStep("pay")
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error).message || "Lỗi khởi tạo thanh toán" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!orderResult?.paymentId) return
    setIsConfirming(true)
    setMessage(null)
    try {
      const res = await confirmSimulatedPayment(orderResult.paymentId)
      if (res.error) {
        setMessage({ type: "error", text: res.error })
      } else {
        setMessage({ type: "success", text: res.message || "Xác nhận thanh toán thành công!" })
        setTimeout(() => {
          setOpen(false)
          setStep("select")
          setOrderResult(null)
        }, 1800)
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error).message || "Lỗi xác nhận thanh toán" })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = async () => {
    if (orderResult?.paymentId) {
      await cancelPendingOrder(orderResult.paymentId)
    }
    setOrderResult(null)
    setStep("select")
    setMessage(null)
  }

  const copyMemo = () => {
    if (!orderResult?.memo) return
    navigator.clipboard.writeText(orderResult.memo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentPrice = PLAN_PRICES[plan][cycle]

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border shadow-2xl p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Nâng cấp & Gia hạn Gói Dịch vụ
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Quản lý kinh doanh nhà trọ chuyên nghiệp & mở rộng không giới hạn
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Dynamic status alert */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {step === "select" ? (
          <div className="space-y-5 pt-2">
            {/* Choose Plan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Chọn Gói Dịch vụ
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Basic Card */}
                <div
                  onClick={() => setPlan("basic")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    plan === "basic"
                      ? "border-blue-600 bg-blue-50/50 shadow-md"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm">Gói BASIC</span>
                    {plan === "basic" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">3 Nhà trọ • Tối đa 30 phòng</p>
                  <div className="text-base font-extrabold text-blue-700">
                    99.000đ<span className="text-[11px] font-normal text-slate-500">/tháng</span>
                  </div>
                </div>

                {/* VIP Card */}
                <div
                  onClick={() => setPlan("vip")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                    plan === "vip"
                      ? "border-amber-500 bg-amber-50/50 shadow-md"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="absolute -right-6 -top-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white text-[9px] font-bold py-3 px-8 rotate-45 shadow">
                    HOT
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Gói VIP
                    </span>
                    {plan === "vip" && <CheckCircle2 className="h-4 w-4 text-amber-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Không giới hạn Nhà & Phòng</p>
                  <div className="text-base font-extrabold text-amber-700">
                    249.000đ<span className="text-[11px] font-normal text-slate-500">/tháng</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Choose Cycle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Chu kỳ Thanh toán
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCycle("monthly")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    cycle === "monthly"
                      ? "border-slate-800 bg-slate-900 text-white font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-xs">Thanh toán theo Tháng</div>
                  <div className="text-sm font-extrabold mt-0.5">
                    {formatVND(PLAN_PRICES[plan].monthly)} /tháng
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCycle("yearly")}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    cycle === "yearly"
                      ? "border-emerald-600 bg-emerald-950 text-white font-bold ring-2 ring-emerald-500/20"
                      : "border-emerald-200 bg-emerald-50/70 text-slate-800 hover:bg-emerald-100"
                  }`}
                >
                  <Badge className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[10px]">
                    Tiết kiệm 17%
                  </Badge>
                  <div className="text-xs">Thanh toán theo Năm (12 tháng)</div>
                  <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                    {formatVND(PLAN_PRICES[plan].yearly)} /năm
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Phương thức Thanh toán
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("bank_transfer")}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                    method === "bank_transfer"
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="h-4 w-4 text-blue-600" />
                  Chuyển khoản QR (VietQR)
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("vnpay")}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                    method === "vnpay"
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Thẻ ATM / VNPay
                </button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 rounded-xl bg-slate-100 flex items-center justify-between border border-slate-200 mt-2">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Tổng tiền thanh toán</span>
                <span className="text-xs font-semibold text-slate-700">
                  {PLAN_PRICES[plan].name} ({cycle === "yearly" ? "1 Năm" : "1 Tháng"})
                </span>
              </div>
              <div className="text-lg font-extrabold text-blue-700">{formatVND(currentPrice)}</div>
            </div>

            <Button
              type="button"
              onClick={handleStartPayment}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 text-sm gap-2 shadow-lg"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Tiến hành thanh toán {formatVND(currentPrice)}
            </Button>
          </div>
        ) : (
          /* Payment QR Step */
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/80 to-slate-50 border border-blue-100 flex flex-col items-center text-center">
              <Badge className="bg-blue-600 text-white text-[10px] mb-2 uppercase tracking-wide">
                Mã QR Chuyển khoản Tự động
              </Badge>

              {orderResult?.qrUrl ? (
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 my-2">
                  <img
                    src={orderResult.qrUrl}
                    alt="VietQR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 my-2">
                  <QrCode className="h-16 w-16" />
                </div>
              )}

              <p className="text-xs text-slate-600 max-w-xs mt-1">
                Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank...) quét mã QR trên để chuyển khoản tự động chính xác.
              </p>
            </div>

            {/* Bank details table */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-900">{PLATFORM_BANK_INFO.bankId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {PLATFORM_BANK_INFO.accountNo}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900">{PLATFORM_BANK_INFO.accountName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-extrabold text-blue-700 text-sm">
                  {formatVND(orderResult?.amount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Nội dung CK:</span>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                    {orderResult?.memo}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyMemo}
                    className="h-7 px-2 text-xs gap-1 text-slate-600 hover:text-slate-900"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? "Đã chép!" : "Chép"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isConfirming}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 text-sm gap-2 shadow-lg"
              >
                {isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Tôi đã chuyển khoản thành công (Kích hoạt ngay)
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isConfirming}
                className="w-full text-slate-500 hover:text-slate-800 text-xs"
              >
                Hủy đơn hàng / Chọn gói khác
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
