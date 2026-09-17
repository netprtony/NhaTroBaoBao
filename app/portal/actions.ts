"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export type ActionState = { error?: string; success?: boolean; message?: string } | null

export async function portalLogin(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()

    const loginIdentifier = (formData.get("loginIdentifier") as string)?.trim()
    const password = (formData.get("password") as string)?.trim()

    if (!loginIdentifier || !password) {
      return { error: "Vui lòng nhập số điện thoại hoặc email và mật khẩu." }
    }

    // 1. Resolve registered auth email via RPC
    const { data: resolvedEmail } = await supabase.rpc("get_tenant_auth_email", {
      p_identifier: loginIdentifier,
    })

    let authEmail = resolvedEmail as string | null
    if (!authEmail) {
      if (loginIdentifier.includes("@")) {
        authEmail = loginIdentifier
      } else {
        const cleanPhone = loginIdentifier.replace(/[^0-9]/g, "")
        authEmail = `${cleanPhone}@tenant.baobaostay.app`
      }
    }

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    })

    if (signInError || !authData.user) {
      return { error: "Số điện thoại/email hoặc mật khẩu không chính xác." }
    }

    // Verify tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, portal_enabled")
      .eq("auth_user_id", authData.user.id)
      .is("deleted_at", null)
      .single()

    if (tenantError || !tenant || !tenant.portal_enabled) {
      await supabase.auth.signOut()
      return { error: "Tài khoản của bạn chưa được cấp quyền truy cập Cổng Khách thuê hoặc đã bị vô hiệu hóa." }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }

  redirect("/portal/dashboard")
}

export async function portalLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/portal/login")
}

export async function portalChangePassword(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()

    const newPassword = (formData.get("newPassword") as string)?.trim()
    const confirmPassword = (formData.get("confirmPassword") as string)?.trim()

    if (!newPassword || newPassword.length < 6) {
      return { error: "Mật khẩu mới phải có ít nhất 6 ký tự." }
    }
    if (newPassword !== confirmPassword) {
      return { error: "Xác nhận mật khẩu mới không trùng khớp." }
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true, message: "Đổi mật khẩu thành công!" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

export async function portalUpdateProfile(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()

    const fullName = (formData.get("fullName") as string)?.trim()

    if (!fullName) {
      return { error: "Họ và tên không được để trống." }
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      return { error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." }
    }

    const { error } = await supabase
      .from("tenants")
      .update({ full_name: fullName })
      .eq("auth_user_id", userData.user.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/portal", "layout")
    return { success: true, message: "Cập nhật thông tin cá nhân thành công!" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}
