import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InvoicePreviewDialog, type InvoicePreviewData, type OrgPaymentConfig } from "@/components/invoices/invoice-preview-dialog"
import { Receipt, CheckCircle2, Clock, Eye, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Hóa đơn của tôi - Cổng Khách thuê - BaoBao Stay",
}

export default async function PortalInvoicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/portal/login")
  }

  // Fetch tenant info
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*, organizations(*)")
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (!tenant) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Chưa tìm thấy thông tin khách thuê</h2>
      </div>
    )
  }

  const org = tenant.organizations as unknown as {
    name: string
    bank_id?: string
    bank_account_no?: string
    bank_account_name?: string
    show_qr_invoice?: boolean
    transfer_template?: string
    invoice_notes?: string
  }

  const paymentConfig: OrgPaymentConfig = {
    bank_id: org?.bank_id || "MB",
    bank_account_no: org?.bank_account_no || "",
    bank_account_name: org?.bank_account_name || "",
    show_qr_invoice: org?.show_qr_invoice ?? true,
    transfer_template: org?.transfer_template || "Phong {room_code} {period}",
    invoice_notes: org?.invoice_notes || "Cảm ơn bạn đã thanh toán tiền phòng đúng hạn!",
  }

  // Fetch tenant leases
  const { data: leases } = await supabase
    .from("leases")
    .select("id, room:rooms(room_code, property:properties(name, address))")
    .eq("tenant_id", tenant.id)

  const leaseIds = leases?.map((l) => l.id) || []

  let invoices: InvoicePreviewData[] = []

  if (leaseIds.length > 0) {
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*, invoice_items(*), meter_readings(*), lease:leases(*, room:rooms(*, property:properties(*)), tenant:tenants(*))")
      .in("lease_id", leaseIds)
      .order("period", { ascending: false })

    if (invoiceData) {
      invoices = invoiceData as unknown as InvoicePreviewData[]
    }
  }

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-400" /> Hóa đơn & Thanh toán
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Lịch sử hóa đơn tiền phòng, tiền điện nước và quét mã VietQR thanh toán.
          </p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
          <Receipt className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">Chưa phát sinh hóa đơn nào</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md">
            Khi chủ trọ lập phiếu báo tiền phòng hàng tháng, bạn sẽ thấy thông báo và mã VietQR thanh toán tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const isPaid = inv.status === "paid"
            const roomCode = inv.lease?.room?.room_code || "---"
            const propertyName = inv.lease?.room?.property?.name || "Khu trọ"

            return (
              <div
                key={inv.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">Hóa đơn Kỳ {inv.period}</span>
                    {isPaid ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Đã thanh toán
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1 text-xs">
                        <Clock className="h-3 w-3" /> Chưa thanh toán
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>Phòng: <strong className="text-slate-200">P.{roomCode} ({propertyName})</strong></span>
                    <span>• Hạn đóng: <strong className="text-slate-200">{new Date(inv.due_date).toLocaleDateString("vi-VN")}</strong></span>
                    {inv.paid_at && <span>• Ngày trả: <strong className="text-emerald-400">{new Date(inv.paid_at).toLocaleDateString("vi-VN")}</strong></span>}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Tổng thanh toán</p>
                    <p className="text-xl font-bold text-emerald-400">{formatVND(inv.total_amount)}</p>
                  </div>

                  <InvoicePreviewDialog
                    invoice={inv}
                    orgName={org?.name || "Nhà Trọ"}
                    paymentConfig={paymentConfig}
                    trigger={
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white font-medium gap-1.5 shadow-md shadow-blue-600/20 text-xs">
                        <Eye className="h-4 w-4" />
                        Xem phiếu & QR
                      </Button>
                    }
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
