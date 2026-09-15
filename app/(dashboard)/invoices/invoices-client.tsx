"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  InvoiceFormDialog,
  type ActiveLeaseOption,
} from "@/components/invoices/invoice-form-dialog"
import {
  InvoicePreviewDialog,
  type InvoicePreviewData,
  type OrgPaymentConfig,
} from "@/components/invoices/invoice-preview-dialog"
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog"
import { markInvoiceAsPaid, markInvoiceAsPending } from "@/app/(dashboard)/invoices/actions"
import {
  Search,
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Pencil,
  Trash2,
  Check,
  Undo2,
  Loader2,
  Gauge,
} from "lucide-react"
import {
  MeterReadingsTable,
  type MeterReadingDisplayItem,
} from "@/components/invoices/meter-readings-table"

type InvoicesClientProps = {
  invoices: InvoicePreviewData[]
  activeLeases: ActiveLeaseOption[]
  meterReadings?: MeterReadingDisplayItem[]
  orgName: string
  paymentConfig?: OrgPaymentConfig
}

export function InvoicesClient({
  invoices,
  activeLeases,
  meterReadings = [],
  orgName,
  paymentConfig,
}: InvoicesClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [mainTab, setMainTab] = useState<"invoices" | "readings">("invoices")

  // Danh sách các kỳ có trong dữ liệu hóa đơn
  const periods = useMemo(() => {
    const set = new Set<string>()
    invoices.forEach((inv) => {
      if (inv.period) set.add(inv.period)
    })
    return Array.from(set).sort().reverse()
  }, [invoices])

  // Lọc hóa đơn theo tìm kiếm, trạng thái, kỳ
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Lọc theo kỳ
      if (periodFilter !== "all" && inv.period !== periodFilter) {
        return false
      }

      // Lọc theo trạng thái
      const isOverdue =
        inv.status === "pending" && new Date(inv.due_date) < new Date()
      if (statusFilter === "paid" && inv.status !== "paid") return false
      if (statusFilter === "pending" && (inv.status !== "pending" || isOverdue))
        return false
      if (statusFilter === "overdue" && !isOverdue) return false

      // Lọc theo từ khóa tìm kiếm (tên khách, mã phòng, sđt)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const tenantName = inv.lease?.tenant?.full_name?.toLowerCase() || ""
        const roomCode = inv.lease?.room?.room_code?.toLowerCase() || ""
        const phone = inv.lease?.tenant?.phone?.toLowerCase() || ""
        const propName = inv.lease?.room?.property?.name?.toLowerCase() || ""

        return (
          tenantName.includes(query) ||
          roomCode.includes(query) ||
          phone.includes(query) ||
          propName.includes(query)
        )
      }

      return true
    })
  }, [invoices, periodFilter, statusFilter, searchTerm])

  // Tính các chỉ số thống kê
  const stats = useMemo(() => {
    // Chỉ tính theo kỳ đang chọn (hoặc tất cả)
    const targetInvoices =
      periodFilter === "all"
        ? invoices
        : invoices.filter((inv) => inv.period === periodFilter)

    const totalAmount = targetInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
    const paidAmount = targetInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
    const pendingAmount = targetInvoices
      .filter((inv) => inv.status === "pending")
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
    const overdueCount = targetInvoices.filter(
      (inv) => inv.status === "pending" && new Date(inv.due_date) < new Date()
    ).length

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueCount,
      totalCount: targetInvoices.length,
    }
  }, [invoices, periodFilter])

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

  // Chuyển đổi trạng thái thanh toán nhanh
  const handleTogglePaid = async (inv: InvoicePreviewData) => {
    setUpdatingId(inv.id)
    try {
      if (inv.status === "paid") {
        await markInvoiceAsPending(inv.id)
      } else {
        await markInvoiceAsPaid(inv.id)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Nút lập hóa đơn */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hóa đơn & Thu tiền
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý phiếu báo tiền phòng, chỉ số điện nước và theo dõi tình trạng thanh toán.
          </p>
        </div>

        <InvoiceFormDialog
          activeLeases={activeLeases}
          existingInvoices={invoices}
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-1.5 self-start sm:self-auto">
              <Plus className="h-4 w-4" />
              Lập hóa đơn mới
            </Button>
          }
        />
      </div>

      {/* Tab chuyển đổi giữa Hóa đơn và Chỉ số */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "invoices" | "readings")}>
        <TabsList className="bg-slate-200/60 p-1">
          <TabsTrigger value="invoices" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" />
            Hóa đơn thu tiền
          </TabsTrigger>
          <TabsTrigger value="readings" className="gap-1.5 text-xs sm:text-sm">
            <Gauge className="h-4 w-4" />
            Bảng chỉ số điện nước ({meterReadings.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mainTab === "readings" ? (
        <MeterReadingsTable readings={meterReadings} />
      ) : (
        <>
          {/* Thẻ thống kê 4 chỉ số */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng tiền cần thu</span>
              <Receipt className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              {formatVND(stats.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              {stats.totalCount} hóa đơn
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600">Đã thu thành công</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-2">
              {formatVND(stats.paidAmount)}
            </div>
            <div className="text-[11px] text-emerald-500 mt-1 font-medium">
              {stats.totalAmount > 0
                ? `${Math.round((stats.paidAmount / stats.totalAmount) * 100)}% chỉ tiêu`
                : "Chưa có dữ liệu"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600">Chờ thanh toán</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-2">
              {formatVND(stats.pendingAmount)}
            </div>
            <div className="text-[11px] text-amber-500 mt-1 font-medium">
              Chưa nộp tiền
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-600">Quá hạn thanh toán</span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-red-600 mt-2">
              {stats.overdueCount} <span className="text-sm font-normal text-slate-500">phòng</span>
            </div>
            <div className="text-[11px] text-red-500 mt-1 font-medium">
              Cần nhắc nhở qua Zalo
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3.5 rounded-lg border shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo Kỳ */}
          <div className="w-36">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn kỳ thu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các kỳ</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    Tháng {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lọc theo Trạng thái */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
            <TabsList className="h-9 p-0.5">
              <TabsTrigger value="all" className="text-xs px-3">
                Tất cả
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs px-3">
                Chờ thu
              </TabsTrigger>
              <TabsTrigger value="paid" className="text-xs px-3">
                Đã thu
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs px-3 text-red-600">
                Quá hạn
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo phòng, tên khách, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Danh sách hóa đơn */}
      {filteredInvoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center bg-white">
          <Receipt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            Không tìm thấy hóa đơn nào
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all" || periodFilter !== "all"
              ? "Hãy thử thay đổi điều kiện tìm kiếm hoặc bộ lọc kỳ thu tiền."
              : "Bắt đầu thu tiền bằng cách tạo hóa đơn đầu tiên cho khách thuê."}
          </p>
          <div className="mt-6">
            <InvoiceFormDialog
              activeLeases={activeLeases}
              existingInvoices={invoices}
              trigger={
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                  <Plus className="h-4 w-4" />
                  Lập hóa đơn mới
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Phòng & Khách thuê</th>
                  <th className="py-3.5 px-4">Kỳ thu tiền</th>
                  <th className="py-3.5 px-4 text-right">Tổng thanh toán</th>
                  <th className="py-3.5 px-4 text-center">Hạn nộp</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const roomCode = inv.lease?.room?.room_code || "---"
                  const propName = inv.lease?.room?.property?.name || ""
                  const tenantName = inv.lease?.tenant?.full_name || "Khách thuê"
                  const tenantPhone = inv.lease?.tenant?.phone || ""
                  const isOverdue =
                    inv.status === "pending" && new Date(inv.due_date) < new Date()
                  const isPaid = inv.status === "paid"

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Phòng & Khách thuê */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          Phòng {roomCode}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tenantName} {tenantPhone && `• ${tenantPhone}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {propName}
                        </div>
                      </td>

                      {/* Kỳ thu tiền */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">
                          Tháng {inv.period}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Lập ngày {formatDate(inv.created_at)}
                        </div>
                      </td>

                      {/* Tổng thanh toán */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {formatVND(inv.total_amount)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tiền phòng: {formatVND(inv.rent_amount)}
                        </div>
                      </td>

                      {/* Hạn nộp */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-medium ${
                            isOverdue
                              ? "text-red-600 font-bold"
                              : "text-slate-600"
                          }`}
                        >
                          {formatDate(inv.due_date)}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-red-500 font-semibold">
                            Quá hạn
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <Check className="h-3 w-3" />
                            Đã thanh toán
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
                            <AlertTriangle className="h-3 w-3" />
                            Quá hạn nộp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            Chờ thanh toán
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem & Xuất Phiếu (PDF / Ảnh / Zalo) */}
                          <InvoicePreviewDialog
                            invoice={inv}
                            orgName={orgName}
                            paymentConfig={paymentConfig}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Xuất phiếu
                              </Button>
                            }
                          />

                          {/* Đánh dấu Đã thu / Hủy thu */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              isPaid
                                ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            onClick={() => handleTogglePaid(inv)}
                            disabled={updatingId === inv.id}
                            title={isPaid ? "Đánh dấu chưa thanh toán" : "Xác nhận đã nhận tiền"}
                          >
                            {updatingId === inv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isPaid ? (
                              <Undo2 className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Sửa */}
                          <InvoiceFormDialog
                            activeLeases={activeLeases}
                            existingInvoices={invoices}
                            invoice={inv}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                title="Chỉnh sửa hóa đơn"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />

                          {/* Xóa */}
                          <DeleteInvoiceDialog
                            invoiceId={inv.id}
                            roomCode={roomCode}
                            period={inv.period}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                title="Xóa hóa đơn"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}