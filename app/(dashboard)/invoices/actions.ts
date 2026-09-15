"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type InvoiceItemInput = {
  id?: string
  label: string
  amount: number
}

export type MeterReadingInput = {
  roomId: string
  electricity?: {
    old: number
    new: number
    price: number
  }
  water?: {
    old: number
    new: number
    price: number
  }
}

export type CreateInvoiceInput = {
  leaseId: string
  period: string
  rentAmount: number
  electricityAmount: number
  waterAmount: number
  otherFees: number
  totalAmount: number
  dueDate: string
  status?: string
  items: InvoiceItemInput[]
  meterReadingData?: MeterReadingInput
}

// 1. Lấy chỉ số điện nước gần nhất của phòng để làm chỉ số cũ
export async function getLatestMeterReadings(roomId: string) {
  try {
    const supabase = await createClient()

    // Lấy chỉ số điện gần nhất
    const { data: latestElec } = await supabase
      .from("meter_readings")
      .select("new_value, unit_price")
      .eq("room_id", roomId)
      .eq("type", "electricity")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Lấy chỉ số nước gần nhất
    const { data: latestWater } = await supabase
      .from("meter_readings")
      .select("new_value, unit_price")
      .eq("room_id", roomId)
      .eq("type", "water")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      electricityOld: Number(latestElec?.new_value || 0),
      waterOld: Number(latestWater?.new_value || 0),
      electricityPrice: Number(latestElec?.unit_price || 3500),
      waterPrice: Number(latestWater?.unit_price || 15000),
    }
  } catch (err) {
    console.error("Lỗi lấy chỉ số gần nhất:", err)
    return {
      electricityOld: 0,
      waterOld: 0,
      electricityPrice: 3500,
      waterPrice: 15000,
    }
  }
}

// 2. Kiểm tra hóa đơn trùng lặp trong cùng kỳ của phòng/hợp đồng
export async function checkInvoiceDuplicate(
  leaseId: string,
  period: string,
  excludeInvoiceId?: string
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from("invoices")
      .select("id, status")
      .eq("lease_id", leaseId)
      .eq("period", period.trim())
      .neq("status", "cancelled")

    if (excludeInvoiceId) {
      query = query.neq("id", excludeInvoiceId)
    }

    const { data } = await query.maybeSingle()
    return !!data
  } catch {
    return false
  }
}

// 2.1. Lấy danh sách lease_id đã lập hóa đơn trong kỳ (chỉ tính hóa đơn chưa hủy)
export async function getInvoicedLeaseIds(period: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("invoices")
      .select("lease_id")
      .eq("period", period.trim())
      .neq("status", "cancelled")

    if (error) {
      console.error("Lỗi lấy danh sách lease đã lập hóa đơn:", error)
      return []
    }

    return (data || []).map((d) => d.lease_id)
  } catch (err) {
    console.error("Lỗi lấy danh sách lease đã lập hóa đơn:", err)
    return []
  }
}

// 3. Tạo hóa đơn mới
export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id")
      .single()

    if (profileError || !profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức của bạn." }
    }

    if (!input.leaseId || !input.period || !input.dueDate) {
      return { error: "Vui lòng điền đầy đủ các thông tin bắt buộc." }
    }

    const cleanPeriod = input.period.trim()

    // BẢO VỆ CHỐNG TRÙNG LẶP: Kiểm tra xem phòng/hợp đồng này đã có hóa đơn trong kỳ chưa
    const isDuplicate = await checkInvoiceDuplicate(input.leaseId, cleanPeriod)
    if (isDuplicate) {
      return {
        error: `Phòng này đã có hóa đơn trong kỳ ${cleanPeriod}. Không thể tạo 2 hóa đơn cho cùng 1 phòng trong cùng một tháng.`,
      }
    }

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        org_id: profile.org_id,
        lease_id: input.leaseId,
        period: cleanPeriod,
        rent_amount: input.rentAmount,
        electricity_amount: input.electricityAmount,
        water_amount: input.waterAmount,
        other_fees: input.otherFees,
        total_amount: input.totalAmount,
        due_date: input.dueDate,
        status: input.status || "pending",
      })
      .select("id")
      .single()

    if (invoiceError || !invoice) {
      return { error: `Lỗi tạo hóa đơn: ${invoiceError?.message}` }
    }

    // Insert invoice items if any
    if (input.items && input.items.length > 0) {
      const itemsToInsert = input.items
        .filter((item) => item.label.trim() !== "" && item.amount > 0)
        .map((item) => ({
          invoice_id: invoice.id,
          label: item.label.trim(),
          amount: item.amount,
        }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(itemsToInsert)

        if (itemsError) {
          console.error("Lỗi thêm dịch vụ hóa đơn:", itemsError)
        }
      }
    }

    // Lưu bản ghi chỉ số vào bảng "meter_readings"
    if (input.meterReadingData && input.meterReadingData.roomId) {
      const { roomId, electricity, water } = input.meterReadingData
      const readingsToInsert = []

      // Ghi nhận chỉ số điện
      if (electricity && typeof electricity.new === "number") {
        const elecOld = Number(electricity.old || 0)
        const elecNew = Number(electricity.new || 0)
        const elecPrice = Number(electricity.price || 0)
        const consumption = Math.max(0, elecNew - elecOld)
        readingsToInsert.push({
          org_id: profile.org_id,
          room_id: roomId,
          invoice_id: invoice.id,
          type: "electricity" as const,
          old_value: elecOld,
          new_value: elecNew,
          unit_price: elecPrice,
          total_amount: consumption * elecPrice,
          period: cleanPeriod,
        })
      }

      // Ghi nhận chỉ số nước
      if (water && typeof water.new === "number") {
        const waterOld = Number(water.old || 0)
        const waterNew = Number(water.new || 0)
        const waterPrice = Number(water.price || 0)
        const consumption = Math.max(0, waterNew - waterOld)
        readingsToInsert.push({
          org_id: profile.org_id,
          room_id: roomId,
          invoice_id: invoice.id,
          type: "water" as const,
          old_value: waterOld,
          new_value: waterNew,
          unit_price: waterPrice,
          total_amount: consumption * waterPrice,
          period: cleanPeriod,
        })
      }

      if (readingsToInsert.length > 0) {
        const { error: readingsError } = await supabase
          .from("meter_readings")
          .insert(readingsToInsert)

        if (readingsError) {
          console.error("Lỗi lưu chỉ số điện nước:", readingsError)
        }
      }
    }

    revalidatePath("/invoices")
    revalidatePath("/dashboard")
    return { success: true, id: invoice.id }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: errorMsg }
  }
}

export type UpdateInvoiceInput = {
  invoiceId: string
  period: string
  rentAmount: number
  electricityAmount: number
  waterAmount: number
  otherFees: number
  totalAmount: number
  dueDate: string
  status: string
  items: InvoiceItemInput[]
  meterReadingData?: MeterReadingInput
}

// 4. Cập nhật hóa đơn
export async function updateInvoice(input: UpdateInvoiceInput) {
  try {
    const supabase = await createClient()
    const cleanPeriod = input.period.trim()

    // Cập nhật thông tin hóa đơn
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        period: cleanPeriod,
        rent_amount: input.rentAmount,
        electricity_amount: input.electricityAmount,
        water_amount: input.waterAmount,
        other_fees: input.otherFees,
        total_amount: input.totalAmount,
        due_date: input.dueDate,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.invoiceId)

    if (updateError) {
      return { error: `Lỗi cập nhật hóa đơn: ${updateError.message}` }
    }

    // Cập nhật các khoản mục phụ phí
    await supabase.from("invoice_items").delete().eq("invoice_id", input.invoiceId)

    if (input.items && input.items.length > 0) {
      const itemsToInsert = input.items
        .filter((item) => item.label.trim() !== "" && item.amount > 0)
        .map((item) => ({
          invoice_id: input.invoiceId,
          label: item.label.trim(),
          amount: item.amount,
        }))

      if (itemsToInsert.length > 0) {
        await supabase.from("invoice_items").insert(itemsToInsert)
      }
    }

    // Cập nhật chỉ số điện nước trong meter_readings nếu có
    if (input.meterReadingData && input.meterReadingData.roomId) {
      const { data: profile } = await supabase.from("profiles").select("org_id").single()
      if (profile?.org_id) {
        // Xóa bản ghi cũ gắn với invoice này
        await supabase.from("meter_readings").delete().eq("invoice_id", input.invoiceId)

        const { roomId, electricity, water } = input.meterReadingData
        const readingsToInsert = []

        if (electricity && typeof electricity.new === "number") {
          const elecOld = Number(electricity.old || 0)
          const elecNew = Number(electricity.new || 0)
          const elecPrice = Number(electricity.price || 0)
          const consumption = Math.max(0, elecNew - elecOld)
          readingsToInsert.push({
            org_id: profile.org_id,
            room_id: roomId,
            invoice_id: input.invoiceId,
            type: "electricity" as const,
            old_value: elecOld,
            new_value: elecNew,
            unit_price: elecPrice,
            total_amount: consumption * elecPrice,
            period: cleanPeriod,
          })
        }

        if (water && typeof water.new === "number") {
          const waterOld = Number(water.old || 0)
          const waterNew = Number(water.new || 0)
          const waterPrice = Number(water.price || 0)
          const consumption = Math.max(0, waterNew - waterOld)
          readingsToInsert.push({
            org_id: profile.org_id,
            room_id: roomId,
            invoice_id: input.invoiceId,
            type: "water" as const,
            old_value: waterOld,
            new_value: waterNew,
            unit_price: waterPrice,
            total_amount: consumption * waterPrice,
            period: cleanPeriod,
          })
        }

        if (readingsToInsert.length > 0) {
          await supabase.from("meter_readings").insert(readingsToInsert)
        }
      }
    }

    revalidatePath("/invoices")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: errorMsg }
  }
}

// 5. Đánh dấu đã thanh toán
export async function markInvoiceAsPaid(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)

    if (error) {
      return { error: `Không thể đánh dấu đã thanh toán: ${error.message}` }
    }

    revalidatePath("/invoices")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi."
    return { error: errorMsg }
  }
}

// 6. Đánh dấu chưa thanh toán
export async function markInvoiceAsPending(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "pending",
        paid_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)

    if (error) {
      return { error: `Không thể cập nhật trạng thái: ${error.message}` }
    }

    revalidatePath("/invoices")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi."
    return { error: errorMsg }
  }
}

// 7. Xóa hóa đơn
export async function deleteInvoice(invoiceId: string) {
  try {
    const supabase = await createClient()

    // Xóa các chỉ số meter_readings gắn với invoice này
    await supabase.from("meter_readings").delete().eq("invoice_id", invoiceId)

    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId)

    if (error) {
      return { error: `Không thể xóa hóa đơn: ${error.message}` }
    }

    revalidatePath("/invoices")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi."
    return { error: errorMsg }
  }
}