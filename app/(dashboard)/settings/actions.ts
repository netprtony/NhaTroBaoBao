"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ActionState = { error?: string; success?: boolean; message?: string } | null

// 1. Cập nhật cấu hình thanh toán & VietQR
export async function updatePaymentSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Bạn chưa đăng nhập." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return { error: "Không tìm thấy tổ chức của bạn." }
    }

    const bankId = (formData.get("bankId") as string) || "MB"
    const bankAccountNo = (formData.get("bankAccountNo") as string)?.trim() || ""
    const bankAccountName = (formData.get("bankAccountName") as string)?.trim().toUpperCase() || ""
    const showQrInvoice = formData.get("showQrInvoice") === "true"
    const transferTemplate =
      (formData.get("transferTemplate") as string)?.trim() || "Phong {room_code} {period}"

    const { error } = await supabase
      .from("organizations")
      .update({
        bank_id: bankId,
        bank_account_no: bankAccountNo,
        bank_account_name: bankAccountName,
        show_qr_invoice: showQrInvoice,
        transfer_template: transferTemplate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.org_id)

    if (error) {
      console.error("Lỗi cập nhật thanh toán:", error)
      return { error: "Không thể lưu thông tin thanh toán: " + error.message }
    }

    revalidatePath("/settings")
    revalidatePath("/invoices")
    return { success: true, message: "Đã lưu cài đặt thanh toán thành công!" }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: msg }
  }
}

// 2. Cập nhật thông tin tổ chức / cơ sở nhà trọ
export async function updateOrganizationSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Bạn chưa đăng nhập." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return { error: "Không tìm thấy tổ chức của bạn." }
    }

    const name = (formData.get("name") as string)?.trim()
    const phone = (formData.get("phone") as string)?.trim() || ""
    const address = (formData.get("address") as string)?.trim() || ""
    const invoiceNotes = (formData.get("invoiceNotes") as string)?.trim() || ""

    if (!name) {
      return { error: "Tên cơ sở / tổ chức không được để trống." }
    }

    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        phone,
        address,
        invoice_notes: invoiceNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.org_id)

    if (error) {
      return { error: "Không thể lưu thông tin cơ sở: " + error.message }
    }

    revalidatePath("/settings")
    revalidatePath("/dashboard")
    revalidatePath("/invoices")
    return { success: true, message: "Đã cập nhật thông tin nhà trọ thành công!" }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: msg }
  }
}

// 3. Cập nhật đơn giá dịch vụ mặc định (Điện, Nước)
export async function updateDefaultRates(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Bạn chưa đăng nhập." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return { error: "Không tìm thấy tổ chức của bạn." }
    }

    const defaultElectricityPrice = Number(formData.get("defaultElectricityPrice") || 3500)
    const defaultWaterPrice = Number(formData.get("defaultWaterPrice") || 20000)

    if (isNaN(defaultElectricityPrice) || defaultElectricityPrice < 0) {
      return { error: "Đơn giá điện không hợp lệ." }
    }
    if (isNaN(defaultWaterPrice) || defaultWaterPrice < 0) {
      return { error: "Đơn giá nước không hợp lệ." }
    }

    const { error } = await supabase
      .from("organizations")
      .update({
        default_electricity_price: defaultElectricityPrice,
        default_water_price: defaultWaterPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.org_id)

    if (error) {
      return { error: "Không thể lưu đơn giá dịch vụ: " + error.message }
    }

    revalidatePath("/settings")
    revalidatePath("/invoices")
    return { success: true, message: "Đã cập nhật đơn giá dịch vụ mặc định!" }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: msg }
  }
}

// 4. Cập nhật hồ sơ cá nhân chủ tài khoản
export async function updateProfileSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Bạn chưa đăng nhập." }
    }

    const fullName = (formData.get("fullName") as string)?.trim()
    const phone = (formData.get("phone") as string)?.trim() || ""

    if (!fullName) {
      return { error: "Họ và tên không được để trống." }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      return { error: "Không thể cập nhật hồ sơ cá nhân: " + error.message }
    }

    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { success: true, message: "Đã cập nhật thông tin cá nhân thành công!" }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: msg }
  }
}
