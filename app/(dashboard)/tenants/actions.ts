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

export async function checkDeleteTenant(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("can_delete_tenant", { p_tenant_id: id })
    
    if (error) {
      return { error: error.message }
    }
    
    return { data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

export async function deleteTenant(id: string) {
  try {
    const supabase = await createClient()

    const { data: checkData, error: checkError } = await supabase.rpc("can_delete_tenant", { p_tenant_id: id })
    if (checkError) return { error: checkError.message }
    const checkResult = checkData as { allowed?: boolean; reason?: string }
    if (checkResult && checkResult.allowed === false) {
      return { error: checkResult.reason || "Không thể xóa khách thuê này." }
    }

    const { error } = await supabase.from("tenants").update({ deleted_at: new Date().toISOString() }).eq("id", id)

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

export async function toggleTenantPortalAccess(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()

    const tenantId = formData.get("tenantId") as string
    const actionType = formData.get("actionType") as string // "enable" | "disable" | "resetPassword"
    const password = (formData.get("password") as string)?.trim()

    if (!tenantId) {
      return { error: "Không tìm thấy thông tin khách thuê." }
    }

    if (actionType === "disable") {
      const { error: updateErr } = await supabase
        .from("tenants")
        .update({ portal_enabled: false })
        .eq("id", tenantId)

      if (updateErr) return { error: updateErr.message }
      revalidatePath("/tenants")
      return { success: true }
    }

    if ((actionType === "enable" || actionType === "resetPassword") && password && password.length < 6) {
      return { error: "Mật khẩu khởi tạo phải có ít nhất 6 ký tự." }
    }

    // Call the secure RPC to create the auth user or update password
    const { error: rpcError } = await (supabase as any).rpc("admin_set_tenant_credentials", {
      p_tenant_id: tenantId,
      p_password: password || "", // if empty, the RPC might still set it but we should require it
    })

    if (rpcError) {
      return { error: `Lỗi cấu hình tài khoản: ${rpcError.message}` }
    }

    revalidatePath("/tenants")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

