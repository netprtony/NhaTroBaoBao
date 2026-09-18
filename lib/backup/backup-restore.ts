"use client"

import { createClient } from "@/lib/supabase/client"

export type BackupPayload = {
  app: "BaoBaoStay"
  version: string
  exported_at: string
  data: {
    properties: Record<string, unknown>[]
    rooms: Record<string, unknown>[]
    tenants: Record<string, unknown>[]
    leases: Record<string, unknown>[]
    invoices: Record<string, unknown>[]
    invoice_items: Record<string, unknown>[]
    meter_readings: Record<string, unknown>[]
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
  } catch (err: unknown) {
    console.error("Lỗi xuất backup JSON:", err)
    return { error: (err as Error).message || "Không thể xuất file dữ liệu" }
  }
}

// Helper chuyển array sang CSV với UTF-8 BOM chuẩn Excel tiếng Việt
export function exportToCSV(fileName: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escapeCSV = (val: unknown) => {
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
  const rows = rooms.map((r: Record<string, unknown>) => {
    const prop = r.property as { name?: string; address?: string } | null
    return [
      r.room_code as string,
      prop?.name || "",
      prop?.address || "",
      (r.area as number) || 0,
      r.base_price as number,
      r.status === "available" ? "Trống" : r.status === "occupied" ? "Đang thuê" : "Bảo trì",
      new Date(r.created_at as string).toLocaleDateString("vi-VN"),
    ]
  })

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
  const rows = invoices.map((inv: Record<string, unknown>) => {
    const lease = inv.lease as { room?: { room_code?: string }; tenant?: { full_name?: string; phone?: string } } | null
    return [
      inv.period as string,
      lease?.room?.room_code || "",
      lease?.tenant?.full_name || "",
      lease?.tenant?.phone || "",
      inv.rent_amount as number,
      inv.electricity_amount as number,
      inv.water_amount as number,
      inv.other_fees as number,
      inv.total_amount as number,
      inv.due_date as string,
      inv.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
      inv.paid_at ? new Date(inv.paid_at as string).toLocaleDateString("vi-VN") : "",
    ]
  })

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
  const rows = readings.map((m: Record<string, unknown>) => {
    const room = m.room as { room_code?: string; property?: { name?: string } } | null
    const oldVal = (m.old_value as number) || 0
    const newVal = (m.new_value as number) || 0
    const consumption = m.consumption !== null ? (m.consumption as number) : Math.max(0, newVal - oldVal)
    return [
      room?.property?.name || "",
      room?.room_code || "",
      m.period as string,
      m.type === "electricity" ? "Điện" : "Nước",
      oldVal,
      newVal,
      consumption,
      m.unit_price as number,
      m.total_amount as number,
      (m.reading_date as string) || "",
    ]
  })

  exportToCSV(`ChiSoDienNuoc_${new Date().toISOString().split("T")[0]}.csv`, headers, rows)
}
