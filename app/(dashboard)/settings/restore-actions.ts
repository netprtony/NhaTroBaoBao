"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type BackupDataInput = {
  app?: string
  version?: string
  data?: {
    properties?: any[]
    rooms?: any[]
    tenants?: any[]
    leases?: any[]
    invoices?: any[]
    invoice_items?: any[]
    meter_readings?: any[]
  }
}

export async function restoreFromBackupJSON(input: BackupDataInput) {
  try {
    const supabase = await createClient()

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id")
      .single()

    if (profileError || !profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức của bạn." }
    }

    if (!input || !input.data) {
      return { error: "File sao lưu không hợp lệ hoặc thiếu dữ liệu." }
    }

    const orgId = profile.org_id
    const { properties = [], rooms = [], tenants = [], leases = [], invoices = [], invoice_items = [], meter_readings = [] } = input.data

    let restoredCount = 0

    // 1. Restore Properties
    if (properties.length > 0) {
      const rows = properties.map((p) => ({
        id: p.id,
        org_id: orgId,
        name: p.name,
        address: p.address,
        description: p.description,
        created_at: p.created_at || new Date().toISOString(),
      }))
      const { error } = await supabase.from("properties").upsert(rows, { onConflict: "id" })
      if (error) console.error("Lỗi khôi phục properties:", error)
      else restoredCount += rows.length
    }

    // 2. Restore Rooms
    if (rooms.length > 0) {
      const rows = rooms.map((r) => ({
        id: r.id,
        org_id: orgId,
        property_id: r.property_id,
        room_code: r.room_code,
        area: r.area,
        base_price: r.base_price,
        status: r.status || "available",
        created_at: r.created_at || new Date().toISOString(),
      }))
      const { error } = await supabase.from("rooms").upsert(rows, { onConflict: "id" })
      if (error) console.error("Lỗi khôi phục rooms:", error)
      else restoredCount += rows.length
    }

    // 3. Restore Tenants
    if (tenants.length > 0) {
      const rows = tenants.map((t) => ({
        id: t.id,
        org_id: orgId,
        full_name: t.full_name,
        phone: t.phone,
        email: t.email,
        id_card_number: t.id_card_number,
        portal_enabled: t.portal_enabled ?? false,
        created_at: t.created_at || new Date().toISOString(),
      }))
      const { error } = await supabase.from("tenants").upsert(rows, { onConflict: "id" })
      if (error) console.error("Lỗi khôi phục tenants:", error)
      else restoredCount += rows.length
    }

    // 4. Restore Leases
    if (leases.length > 0) {
      const rows = leases.map((l) => ({
        id: l.id,
        org_id: orgId,
        room_id: l.room_id,
        tenant_id: l.tenant_id,
        start_date: l.start_date,
        end_date: l.end_date,
        monthly_rent: l.monthly_rent,
        deposit: l.deposit,
        status: l.status || "active",
        created_at: l.created_at || new Date().toISOString(),
      }))
      const { error } = await supabase.from("leases").upsert(rows, { onConflict: "id" })
      if (error) console.error("Lỗi khôi phục leases:", error)
      else restoredCount += rows.length
    }

    // 5. Restore Invoices
    if (invoices.length > 0) {
      const rows = invoices.map((inv) => ({
        id: inv.id,
        org_id: orgId,
        lease_id: inv.lease_id,
        period: inv.period,
        rent_amount: inv.rent_amount,
        electricity_amount: inv.electricity_amount,
        water_amount: inv.water_amount,
        other_fees: inv.other_fees,
        total_amount: inv.total_amount,
        due_date: inv.due_date,
        status: inv.status || "pending",
        paid_at: inv.paid_at,
        created_at: inv.created_at || new Date().toISOString(),
      }))
      const { error } = await supabase.from("invoices").upsert(rows, { onConflict: "id" })
      if (error) console.error("Lỗi khôi phục invoices:", error)
      else restoredCount += rows.length
    }

    // 6. Restore Invoice Items
    if (invoice_items.length > 0) {
      const rows = invoice_items.map((it) => ({
        id: it.id,
        invoice_id: it.invoice_id,
        label: it.label,
        amount: it.amount,
      }))
      const { error } = await supabase.from("invoice_items").upsert(rows, { onConflict: "id" })
      if (error) console.error("Lỗi khôi phục invoice_items:", error)
    }

    // 7. Restore Meter Readings
    if (meter_readings.length > 0) {
      const rows = meter_readings.map((m) => ({
        id: m.id,
        org_id: orgId,
        room_id: m.room_id,
        invoice_id: m.invoice_id,
        type: m.type,
        old_value: m.old_value,
        new_value: m.new_value,
        consumption: m.consumption,
        unit_price: m.unit_price,
        total_amount: m.total_amount,
        period: m.period,
        reading_date: m.reading_date || new Date().toISOString(),
        created_at: m.created_at || new Date().toISOString(),
      }))
      const { error } = await supabase.from("meter_readings").upsert(rows, { onConflict: "id" })
      if (error) console.error("Lỗi khôi phục meter_readings:", error)
    }

    revalidatePath("/dashboard")
    revalidatePath("/properties")
    revalidatePath("/invoices")

    return {
      success: true,
      message: `Đã khôi phục thành công ${restoredCount} bản ghi dữ liệu từ file sao lưu JSON!`,
    }
  } catch (err: any) {
    console.error("Lỗi khôi phục dữ liệu:", err)
    return { error: err.message || "Đã xảy ra lỗi khi đọc file sao lưu." }
  }
}
