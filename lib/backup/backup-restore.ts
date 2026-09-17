"use client"

import { createClient } from "@/lib/supabase/client"

export type BackupPayload = {
  app: "BaoBaoStay"
  version: string
  exported_at: string
  data: {
    properties: any[]
    rooms: any[]
    tenants: any[]
    leases: any[]
    invoices: any[]
    invoice_items: any[]
    meter_readings: any[]
  }
}

// Helper tải file xuống browser
function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 1. Sao lưu toàn bộ dữ liệu ra file JSON
export async function exportAllDataJSON(): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Vui lòng đăng nhập để thực hiện" }

    const [
      { data: properties },
      { data: rooms },
      { data: tenants },
      { data: leases },
      { data: invoices },
      { data: invoiceItems },
      { data: meterReadings },
    ] = await Promise.all([
      supabase.from("properties").select("*"),
      supabase.from("rooms").select("*"),
      supabase.from("tenants").select("*"),
      supabase.from("leases").select("*"),
      supabase.from("invoices").select("*"),
      supabase.from("invoice_items").select("*"),
      supabase.from("meter_readings").select("*"),
    ])

    const payload: BackupPayload = {
      app: "BaoBaoStay",
      version: "1.2.0",
      exported_at: new Date().toISOString(),
      data: {
        properties: properties || [],
        rooms: rooms || [],
        tenants: tenants || [],
        leases: leases || [],
        invoices: invoices || [],
        invoice_items: invoiceItems || [],
        meter_readings: meterReadings || [],
      },
    }

    const dateStr = new Date().toISOString().split("T")[0]
    const fileName = `BaoBaoStay_Backup_${dateStr}.json`
    const jsonStr = JSON.stringify(payload, null, 2)

    downloadFile(jsonStr, fileName, "application/json")
    return { success: true }
  } catch (err: any) {
    console.error("Lỗi xuất backup JSON:", err)
    return { error: err.message || "Không thể xuất file dữ liệu" }
  }
}

// Helper chuyển array sang CSV với UTF-8 BOM chuẩn Excel tiếng Việt
export function exportToCSV(fileName: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const csvContent =
    "\uFEFF" +
    headers.map(escapeCSV).join(",") +
    "\n" +
    rows.map((row) => row.map(escapeCSV).join(",")).join("\n")

  downloadFile(csvContent, fileName, "text/csv;charset=utf-8;")
}

// 2. Xuất CSV danh sách Nhà trọ & Phòng
export async function exportRoomsCSV() {
  const supabase = createClient()
  const { data: rooms } = await supabase
    .from("rooms")
    .select("room_code, area, base_price, status, created_at, property:properties(name, address)")

  if (!rooms || rooms.length === 0) {
    throw new Error("Không có dữ liệu phòng trọ để xuất.")
  }

  const headers = ["Mã phòng", "Tên nhà trọ", "Địa chỉ", "Diện tích (m²)", "Giá thuê (VNĐ)", "Trạng thái", "Ngày tạo"]
  const rows = rooms.map((r: any) => [
    r.room_code,
    r.property?.name || "",
    r.property?.address || "",
    r.area || 0,
    r.base_price,
    r.status === "available" ? "Trống" : r.status === "occupied" ? "Đang thuê" : "Bảo trì",
    new Date(r.created_at).toLocaleDateString("vi-VN"),
  ])

  exportToCSV(`DanhSachPhong_${new Date().toISOString().split("T")[0]}.csv`, headers, rows)
}

// 3. Xuất CSV danh sách Hóa đơn
export async function exportInvoicesCSV() {
  const supabase = createClient()
  const { data: invoices } = await supabase
    .from("invoices")
    .select("period, rent_amount, electricity_amount, water_amount, other_fees, total_amount, due_date, status, paid_at, created_at, lease:leases(room:rooms(room_code), tenant:tenants(full_name, phone))")

  if (!invoices || invoices.length === 0) {
    throw new Error("Không có dữ liệu hóa đơn để xuất.")
  }

  const headers = ["Kỳ thu tiền", "Phòng", "Khách thuê", "SĐT", "Tiền phòng", "Tiền điện", "Tiền nước", "Phụ phí", "Tổng tiền", "Hạn nộp", "Trạng thái", "Ngày thu"]
  const rows = invoices.map((inv: any) => [
    inv.period,
    inv.lease?.room?.room_code || "",
    inv.lease?.tenant?.full_name || "",
    inv.lease?.tenant?.phone || "",
    inv.rent_amount,
    inv.electricity_amount,
    inv.water_amount,
    inv.other_fees,
    inv.total_amount,
    inv.due_date,
    inv.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
    inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("vi-VN") : "",
  ])

  exportToCSV(`DanhSachHoaDon_${new Date().toISOString().split("T")[0]}.csv`, headers, rows)
}

// 4. Xuất CSV Chỉ số Điện nước
export async function exportMeterReadingsCSV() {
  const supabase = createClient()
  const { data: readings } = await supabase
    .from("meter_readings")
    .select("period, type, old_value, new_value, consumption, unit_price, total_amount, reading_date, room:rooms(room_code, property:properties(name))")

  if (!readings || readings.length === 0) {
    throw new Error("Không có chỉ số điện nước để xuất.")
  }

  const headers = ["Nhà trọ", "Phòng", "Kỳ chốt", "Loại", "Chỉ số cũ", "Chỉ số mới", "Tiêu thụ", "Đơn giá", "Thành tiền", "Ngày ghi"]
  const rows = readings.map((m: any) => [
    m.room?.property?.name || "",
    m.room?.room_code || "",
    m.period,
    m.type === "electricity" ? "Điện" : "Nước",
    m.old_value,
    m.new_value,
    m.consumption !== null ? m.consumption : Math.max(0, m.new_value - m.old_value),
    m.unit_price,
    m.total_amount,
    m.reading_date || "",
  ])

  exportToCSV(`ChiSoDienNuoc_${new Date().toISOString().split("T")[0]}.csv`, headers, rows)
}
