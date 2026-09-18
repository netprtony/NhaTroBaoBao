/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import {
  Crown,
  Search,
  Building2,
  User,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { manualRenewSubscription, changeOrgPlanDirectly } from "@/app/admin/subscriptions/actions"
import { formatVND } from "@/lib/payment/vnpay"

interface AdminSubscriptionsClientProps {
  organizations: any[]
  totalRevenue: number
  mrr: number
  paidCount: number
  expiringSoonCount: number
}

export function AdminSubscriptionsClient({
  organizations,
  totalRevenue,
  mrr,
  paidCount,
  expiringSoonCount,
}: AdminSubscriptionsClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")

  const [selectedOrg, setSelectedOrg] = useState<any | null>(null)
  const [isRenewOpen, setIsRenewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    const nameMatch = (org.name as string)?.toLowerCase().includes(searchTerm.toLowerCase())
    const slugMatch = (org.slug as string)?.toLowerCase().includes(searchTerm.toLowerCase())
    const profiles = org.profiles as { email?: string }[] | undefined
    const ownerEmail = profiles?.[0]?.email || ""
    const emailMatch = ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSearch = nameMatch || slugMatch || emailMatch

    if (planFilter === "all") return matchesSearch
    if (planFilter === "expiring") {
      if (!org.plan_expires_at) return false
      const daysLeft = (new Date(org.plan_expires_at as string).getTime() - Date.now()) / (1000 * 3600 * 24)
      return matchesSearch && daysLeft >= 0 && daysLeft <= 7
    }
    return matchesSearch && org.plan === planFilter
  })

  const handleRenewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await manualRenewSubscription(formData)
      if (res.error) {
        setMessage({ type: "error", text: res.error })
      } else {
        setMessage({ type: "success", text: res.message || "Đã gia hạn thành công!" })
        setTimeout(() => {
          setIsRenewOpen(false)
          setMessage(null)
        }, 1500)
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error).message || "Lỗi gia hạn thủ công" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePlan = async (orgId: string, newPlan: "free" | "basic" | "vip") => {
    if (!confirm(`Bạn có chắc chắn muốn chuyển tổ chức này sang gói ${newPlan.toUpperCase()}?`)) return
    try {
      const res = await changeOrgPlanDirectly(orgId, newPlan)
      if (res.error) alert(res.error)
      else alert(res.message)
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Doanh thu Hàng tháng (MRR)</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-emerald-400">
              {formatVND(mrr)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Tính từ các tổ chức đang duy trì Basic & VIP
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Tổng Doanh thu Tích lũy</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-blue-400">
              {formatVND(totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Tổng toàn bộ hóa đơn thanh toán thành công
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Tổ chức Trả phí (Basic/VIP)</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-amber-400">
              {paidCount} <span className="text-xs font-normal text-slate-400">/ {organizations.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Số tài khoản đang trả phí đăng ký
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Sắp Hết hạn (trong 7 ngày)</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-rose-400">
              {expiringSoonCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Cần theo dõi & hỗ trợ nhắc gia hạn
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Tìm theo tên tổ chức, slug, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Button
            size="sm"
            variant={planFilter === "all" ? "default" : "outline"}
            onClick={() => setPlanFilter("all")}
            className={planFilter === "all" ? "bg-violet-600 text-white" : "border-slate-800 text-slate-400"}
          >
            Tất cả ({organizations.length})
          </Button>
          <Button
            size="sm"
            variant={planFilter === "free" ? "default" : "outline"}
            onClick={() => setPlanFilter("free")}
            className={planFilter === "free" ? "bg-slate-700 text-white" : "border-slate-800 text-slate-400"}
          >
            Free
          </Button>
          <Button
            size="sm"
            variant={planFilter === "basic" ? "default" : "outline"}
            onClick={() => setPlanFilter("basic")}
            className={planFilter === "basic" ? "bg-blue-600 text-white" : "border-slate-800 text-slate-400"}
          >
            Basic
          </Button>
          <Button
            size="sm"
            variant={planFilter === "vip" ? "default" : "outline"}
            onClick={() => setPlanFilter("vip")}
            className={planFilter === "vip" ? "bg-amber-600 text-white" : "border-slate-800 text-slate-400"}
          >
            VIP
          </Button>
          <Button
            size="sm"
            variant={planFilter === "expiring" ? "default" : "outline"}
            onClick={() => setPlanFilter("expiring")}
            className={planFilter === "expiring" ? "bg-rose-600 text-white" : "border-slate-800 text-slate-400"}
          >
            Sắp hết hạn
          </Button>
        </div>
      </div>

      {/* Organizations Table */}
      <Card className="bg-slate-900 border-slate-800 text-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tổ chức</th>
                <th className="py-3 px-4">Chủ sở hữu</th>
                <th className="py-3 px-4">Gói cước</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Hạn sử dụng</th>
                <th className="py-3 px-4">Đã thanh toán</th>
                <th className="py-3 px-4 text-right">Thao tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Không tìm thấy tổ chức nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const owner = org.profiles?.[0]
                  const isFree = org.plan === "free"
                  const isVip = org.plan === "vip"
                  const isBasic = org.plan === "basic"

                  const expDate = org.plan_expires_at ? new Date(org.plan_expires_at) : null
                  const daysLeft = expDate
                    ? Math.ceil((expDate.getTime() - Date.now()) / (1000 * 3600 * 24))
                    : null

                  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
                  const isExpired = daysLeft !== null && daysLeft < 0

                  const totalPaidOrg = ((org.subscription_payments as Record<string, unknown>[]) || [])
                    .filter((p) => p.status === "success")
                    .reduce((sum: number, p) => sum + ((p.amount as number) || 0), 0)

                  return (
                    <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                          <div>
                            <div>{org.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{org.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <div>
                            <div>{owner?.full_name || "Chưa cập nhật"}</div>
                            <div className="text-[10px] text-slate-500">{owner?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          className={`uppercase text-[10px] ${
                            isVip
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : isBasic
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {org.plan || "free"}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            org.plan_status === "active"
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                              : "bg-rose-950/60 text-rose-400 border-rose-800"
                          }`}
                        >
                          {org.plan_status || "active"}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        {isFree ? (
                          <span className="text-slate-500 font-mono text-[11px]">Vĩnh viễn</span>
                        ) : expDate ? (
                          <div>
                            <div className="font-mono text-slate-200">
                              {expDate.toLocaleDateString("vi-VN")}
                            </div>
                            <div className="text-[10px]">
                              {isExpired ? (
                                <span className="text-rose-400 font-semibold">Đã hết hạn</span>
                              ) : isExpiringSoon ? (
                                <span className="text-amber-400 font-semibold">Còn {daysLeft} ngày</span>
                              ) : (
                                <span className="text-slate-500">Còn {daysLeft} ngày</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-emerald-400 font-mono">
                        {formatVND(totalPaidOrg)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOrg(org)
                              setIsRenewOpen(true)
                            }}
                            className="bg-violet-600 hover:bg-violet-700 text-white text-[11px] h-7 px-2.5 gap-1 font-medium"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Gia hạn
                          </Button>

                          <Select
                            onValueChange={(val: "free" | "basic" | "vip") => handleChangePlan(org.id as string, val)}
                            defaultValue={(org.plan as string) || "free"}
                          >
                            <SelectTrigger className="h-7 w-24 bg-slate-950 border-slate-800 text-[11px] text-slate-300">
                              <SelectValue placeholder="Đổi gói" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Gia hạn thủ công */}
      {selectedOrg && (
        <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
                <Crown className="h-5 w-5 text-amber-400" />
                Gia hạn Thủ công — {selectedOrg.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Thêm thời hạn sử dụng và lưu vết thanh toán thủ công cho khách hàng.
              </DialogDescription>
            </DialogHeader>

            {message && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-rose-950 text-rose-300 border border-rose-800"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleRenewSubmit} className="space-y-4 pt-2">
              <input type="hidden" name="orgId" value={selectedOrg.id} />

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Gói gia hạn</Label>
                <Select name="plan" defaultValue={selectedOrg.plan === "vip" ? "vip" : "basic"}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="basic">Gói BASIC (99k/tháng)</SelectItem>
                    <SelectItem value="vip">Gói VIP (249k/tháng)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Thời gian gia hạn</Label>
                <Select name="months" defaultValue="1">
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="1">+1 Tháng</SelectItem>
                    <SelectItem value="3">+3 Tháng</SelectItem>
                    <SelectItem value="6">+6 Tháng</SelectItem>
                    <SelectItem value="12">+12 Tháng (1 Năm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Số tiền ghi nhận (VND)</Label>
                <Input
                  type="number"
                  name="amount"
                  placeholder="Để trống nếu 0đ"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Ghi chú / Lý do gia hạn</Label>
                <Input
                  name="reason"
                  placeholder="VD: Khách chuyển khoản ngân hàng trực tiếp"
                  defaultValue="Thanh toán chuyển khoản ngân hàng"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsRenewOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Hủy
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isSubmitting ? "Đang gia hạn..." : "Xác nhận Gia hạn"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
