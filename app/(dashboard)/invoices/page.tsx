import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InvoicesClient } from "./invoices-client"
import { type ActiveLeaseOption } from "@/components/invoices/invoice-form-dialog"
import { type InvoicePreviewData } from "@/components/invoices/invoice-preview-dialog"

export const metadata = {
  title: "Hóa đơn & Thu tiền - BaoBao Stay",
}

export default async function InvoicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Lấy thông tin tổ chức
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single()

  const orgData = Array.isArray(profile?.organizations)
    ? profile?.organizations[0]
    : profile?.organizations
  const orgName = orgData?.name || "Cơ sở kinh doanh"

  // 1. Fetch danh sách hóa đơn
  const { data: invoicesData, error: invoicesError } = await supabase
    .from("invoices")
    .select(`
      id,
      lease_id,
      period,
      rent_amount,
      electricity_amount,
      water_amount,
      other_fees,
      total_amount,
      due_date,
      status,
      paid_at,
      created_at,
      invoice_items (
        id,
        label,
        amount
      ),
      lease:leases (
        room:rooms (
          room_code,
          property:properties (
            name,
            address
          )
        ),
        tenant:tenants (
          full_name,
          phone
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (invoicesError) {
    console.error("Lỗi tải danh sách hóa đơn:", invoicesError)
  }

  // 2. Fetch danh sách hợp đồng active để tạo hóa đơn mới
  const { data: activeLeasesData, error: leasesError } = await supabase
    .from("leases")
    .select(`
      id,
      room_id,
      monthly_rent,
      room:rooms (
        room_code,
        property:properties (
          name
        )
      ),
      tenant:tenants (
        id,
        full_name,
        phone
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (leasesError) {
    console.error("Lỗi tải danh sách hợp đồng active:", leasesError)
  }

  // 3. Fetch danh sách chỉ số điện nước
  const { data: meterReadingsData, error: meterError } = await supabase
    .from("meter_readings")
    .select(`
      id,
      room_id,
      invoice_id,
      type,
      old_value,
      new_value,
      consumption,
      unit_price,
      total_amount,
      period,
      reading_date,
      created_at,
      room:rooms (
        room_code,
        property:properties (
          name
        )
      )
    `)
    .order("reading_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (meterError) {
    console.error("Lỗi tải danh sách chỉ số điện nước:", meterError)
  }

  // Ép kiểu dữ liệu an toàn
  const invoices = (invoicesData || []) as unknown as InvoicePreviewData[]
  const activeLeases = (activeLeasesData || []) as unknown as ActiveLeaseOption[]
  const meterReadings = (meterReadingsData || []) as unknown as import("@/components/invoices/meter-readings-table").MeterReadingDisplayItem[]

  return (
    <InvoicesClient
      invoices={invoices}
      activeLeases={activeLeases}
      meterReadings={meterReadings}
      orgName={orgName}
      paymentConfig={orgData || undefined}
    />
  )
}