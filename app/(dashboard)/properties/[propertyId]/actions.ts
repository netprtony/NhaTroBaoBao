"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ActionState = { error?: string; success?: boolean } | null

export async function createRoom(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase.from("profiles").select("org_id").single()
    
    if (profileError || !profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức" }
    }

    const propertyId = formData.get("propertyId") as string
    const roomCode = formData.get("roomCode") as string
    const area = formData.get("area") ? Number(formData.get("area")) : null
    const basePrice = Number(formData.get("basePrice"))
    const status = formData.get("status") as "available" | "occupied" | "maintenance"

    if (!propertyId || !roomCode || isNaN(basePrice)) {
      return { error: "Mã phòng và giá thuê không được để trống" }
    }

    const { error } = await supabase.from("rooms").insert({
      org_id: profile.org_id,
      property_id: propertyId,
      room_code: roomCode,
      area: area,
      base_price: basePrice,
      status: status || "available"
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/properties/${propertyId}`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi"
    return { error: message }
  }
}

export async function updateRoom(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()
    
    const id = formData.get("id") as string
    const propertyId = formData.get("propertyId") as string
    const roomCode = formData.get("roomCode") as string
    const area = formData.get("area") ? Number(formData.get("area")) : null
    const basePrice = Number(formData.get("basePrice"))
    const status = formData.get("status") as "available" | "occupied" | "maintenance"

    if (!id || !propertyId || !roomCode || isNaN(basePrice)) {
      return { error: "Thiếu thông tin bắt buộc" }
    }

    const { error } = await supabase.from("rooms").update({
      room_code: roomCode,
      area: area,
      base_price: basePrice,
      status: status
    }).eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/properties/${propertyId}`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi"
    return { error: message }
  }
}

export async function deleteRoom(id: string, propertyId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.from("rooms").delete().eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/properties/${propertyId}`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi"
    return { error: message }
  }
}
