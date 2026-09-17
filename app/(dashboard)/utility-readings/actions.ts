"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ActionState = { error?: string; success?: boolean; message?: string } | null

export async function saveSingleReading(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: profile } = await supabase.from("profiles").select("org_id").single()
    if (!profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức của bạn." }
    }

    const roomId = formData.get("roomId") as string
    const period = (formData.get("period") as string)?.trim()
    const electricityOld = Number(formData.get("electricityOld")) || 0
    const electricityNew = Number(formData.get("electricityNew")) || 0
    const waterOld = Number(formData.get("waterOld")) || 0
    const waterNew = Number(formData.get("waterNew")) || 0
    const meterReplaced = formData.get("meterReplaced") === "true"

    if (!roomId || !period) {
      return { error: "Không tìm thấy thông tin phòng hoặc kỳ chốt số." }
    }

    if (!meterReplaced) {
      if (electricityNew < electricityOld) {
        return { error: "Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số điện cũ (trừ khi tích Chọn Đổi công tơ)." }
      }
      if (waterNew < waterOld) {
        return { error: "Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số nước cũ (trừ khi tích Chọn Đổi công tơ)." }
      }
    }

    // Fetch org unit prices
    const { data: org } = await supabase
      .from("organizations")
      .select("default_electricity_price, default_water_price")
      .eq("id", profile.org_id)
      .single()

    const elecPrice = org?.default_electricity_price || 3500
    const waterPrice = org?.default_water_price || 20000

    const elecCons = Math.max(0, electricityNew - electricityOld)
    const waterCons = Math.max(0, waterNew - waterOld)

    const rows = [
      {
        org_id: profile.org_id,
        room_id: roomId,
        period,
        type: "electricity",
        old_value: electricityOld,
        new_value: electricityNew,
        consumption: elecCons,
        unit_price: elecPrice,
        total_amount: elecCons * elecPrice,
      },
      {
        org_id: profile.org_id,
        room_id: roomId,
        period,
        type: "water",
        old_value: waterOld,
        new_value: waterNew,
        consumption: waterCons,
        unit_price: waterPrice,
        total_amount: waterCons * waterPrice,
      },
    ]

    const { error } = await supabase.from("meter_readings").upsert(rows, {
      onConflict: "room_id, period, type",
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/utility-readings")
    revalidatePath("/properties")
    revalidatePath("/invoices")
    return { success: true, message: `Đã lưu chỉ số kỳ ${period} thành công!` }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

export type BatchReadingItem = {
  roomId: string
  electricityOld: number
  electricityNew: number
  waterOld: number
  waterNew: number
  meterReplaced?: boolean
}

export async function saveBatchReadings(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: profile } = await supabase.from("profiles").select("org_id").single()
    if (!profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức của bạn." }
    }

    const period = (formData.get("period") as string)?.trim()
    const rawData = formData.get("readingsJson") as string

    if (!period || !rawData) {
      return { error: "Thiếu thông tin kỳ chốt số hoặc danh sách chỉ số." }
    }

    const orgId = profile.org_id
    const items: BatchReadingItem[] = JSON.parse(rawData)
    if (!Array.isArray(items) || items.length === 0) {
      return { error: "Không có danh sách phòng nào để ghi chỉ số." }
    }

    // Fetch org unit prices
    const { data: org } = await supabase
      .from("organizations")
      .select("default_electricity_price, default_water_price")
      .eq("id", orgId)
      .single()

    const elecPrice = org?.default_electricity_price || 3500
    const waterPrice = org?.default_water_price || 20000

    // Prepare rows for upsert into meter_readings
    const rows: Array<{
      org_id: string
      room_id: string
      period: string
      type: "electricity" | "water"
      old_value: number
      new_value: number
      consumption: number
      unit_price: number
      total_amount: number
    }> = []

    items.forEach((item) => {
      const eOld = Number(item.electricityOld) || 0
      const eNew = Number(item.electricityNew) || 0
      const wOld = Number(item.waterOld) || 0
      const wNew = Number(item.waterNew) || 0

      const eCons = Math.max(0, eNew - eOld)
      const wCons = Math.max(0, wNew - wOld)

      rows.push(
        {
          org_id: orgId,
          room_id: item.roomId,
          period,
          type: "electricity",
          old_value: eOld,
          new_value: eNew,
          consumption: eCons,
          unit_price: elecPrice,
          total_amount: eCons * elecPrice,
        },
        {
          org_id: orgId,
          room_id: item.roomId,
          period,
          type: "water",
          old_value: wOld,
          new_value: wNew,
          consumption: wCons,
          unit_price: waterPrice,
          total_amount: wCons * waterPrice,
        }
      )
    })

    const { error } = await supabase.from("meter_readings").upsert(rows, {
      onConflict: "room_id, period, type",
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/utility-readings")
    revalidatePath("/properties")
    revalidatePath("/invoices")
    return { success: true, message: `Đã cập nhật chỉ số kỳ ${period} cho ${items.length} phòng!` }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}
