"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ActionState = { error?: string; success?: boolean } | null

export async function createTenant(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id")
      .single()

    if (profileError || !profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức của bạn." }
    }

    const fullName = (formData.get("fullName") as string)?.trim()
    const phone = (formData.get("phone") as string)?.trim()
    const idCardNumber = (formData.get("idCardNumber") as string)?.trim() || null
    const email = (formData.get("email") as string)?.trim() || null

    if (!fullName) {
      return { error: "Họ và tên khách thuê không được để trống." }
    }
    if (!phone) {
      return { error: "Số điện thoại không được để trống." }
    }

    const { error } = await supabase.from("tenants").insert({
      org_id: profile.org_id,
      full_name: fullName,
      phone,
      id_card_number: idCardNumber,
      email,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/tenants")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

export async function updateTenant(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()

    const id = formData.get("id") as string
    const fullName = (formData.get("fullName") as string)?.trim()
    const phone = (formData.get("phone") as string)?.trim()
    const idCardNumber = (formData.get("idCardNumber") as string)?.trim() || null
    const email = (formData.get("email") as string)?.trim() || null

    if (!id || !fullName || !phone) {
      return { error: "Vui lòng nhập đầy đủ họ tên và số điện thoại." }
    }

    const { error } = await supabase
      .from("tenants")
      .update({
        full_name: fullName,
        phone,
        id_card_number: idCardNumber,
        email,
      })
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/tenants")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

export async function deleteTenant(id: string) {
  try {
    const supabase = await createClient()

    // Kiểm tra xem khách thuê có hợp đồng active không
    const { data: activeLeases, error: leaseError } = await supabase
      .from("leases")
      .select("id")
      .eq("tenant_id", id)
      .eq("status", "active")
      .limit(1)

    if (leaseError) {
      return { error: leaseError.message }
    }

    if (activeLeases && activeLeases.length > 0) {
      return {
        error: "Không thể xóa khách đang có hợp đồng hiệu lực! Vui lòng thanh lý hợp đồng trước.",
      }
    }

    const { error } = await supabase.from("tenants").delete().eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/tenants")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}
