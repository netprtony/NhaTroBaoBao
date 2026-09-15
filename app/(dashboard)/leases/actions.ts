"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ActionState = { error?: string; success?: boolean } | null

export async function createLease(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id")
      .single()

    if (profileError || !profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức của bạn." }
    }

    const roomId = formData.get("roomId") as string
    const tenantId = formData.get("tenantId") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const deposit = Number(formData.get("deposit") || 0)
    const monthlyRent = Number(formData.get("monthlyRent") || 0)
    const contractFile = formData.get("contractFile") as File | null

    if (!roomId || !tenantId || !startDate || !endDate) {
      return { error: "Vui lòng chọn phòng, khách thuê và thời hạn hợp đồng." }
    }

    if (isNaN(deposit) || isNaN(monthlyRent) || monthlyRent <= 0) {
      return { error: "Vui lòng nhập giá thuê hàng tháng hợp lệ." }
    }

    // 1. Kiểm tra phòng có thuộc tổ chức và đang còn trống (available) không
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("id, status")
      .eq("id", roomId)
      .eq("org_id", profile.org_id)
      .single()

    if (roomError || !roomData) {
      return { error: "Không tìm thấy thông tin phòng hoặc phòng không thuộc quyền quản lý của bạn." }
    }

    if (roomData.status !== "available") {
      return { error: "Phòng này hiện không còn trống (đang có khách thuê hoặc đang bảo trì)." }
    }

    // 2. Kiểm tra khách thuê có thuộc tổ chức và chưa có hợp đồng active nào không
    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", tenantId)
      .eq("org_id", profile.org_id)
      .single()

    if (tenantError || !tenantData) {
      return { error: "Không tìm thấy thông tin khách thuê trong tổ chức của bạn." }
    }

    const { data: existingActiveLease } = await supabase
      .from("leases")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .maybeSingle()

    if (existingActiveLease) {
      return { error: "Khách thuê này hiện đang đứng tên hợp đồng thuê hiệu lực. Không thể tạo thêm hợp đồng mới." }
    }

    let contractFilePath: string | null = null

    // Xử lý upload file hợp đồng nếu có
    if (contractFile && contractFile.size > 0) {
      // Giới hạn 10MB
      if (contractFile.size > 10 * 1024 * 1024) {
        return { error: "File hợp đồng không được vượt quá 10MB." }
      }

      const fileExt = contractFile.name.split(".").pop()?.toLowerCase() || "pdf"
      const allowedExts = ["pdf", "png", "jpg", "jpeg", "docx"]
      if (!allowedExts.includes(fileExt)) {
        return { error: "Định dạng file không hỗ trợ (chỉ nhận PDF, JPG, PNG, DOCX)." }
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const storagePath = `${profile.org_id}/${fileName}`

      const arrayBuffer = await contractFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(storagePath, buffer, {
          contentType: contractFile.type,
          upsert: true,
        })

      if (uploadError) {
        return { error: `Lỗi tải lên file hợp đồng: ${uploadError.message}` }
      }

      contractFilePath = storagePath
    }

    // Tạo bản ghi hợp đồng
    const { error: leaseError } = await supabase.from("leases").insert({
      org_id: profile.org_id,
      room_id: roomId,
      tenant_id: tenantId,
      start_date: startDate,
      end_date: endDate,
      deposit,
      monthly_rent: monthlyRent,
      contract_file_url: contractFilePath,
      status: "active",
    })

    if (leaseError) {
      return { error: leaseError.message }
    }

    // Tự động cập nhật phòng sang trạng thái "Đang thuê" (occupied)
    await supabase.from("rooms").update({ status: "occupied" }).eq("id", roomId)

    revalidatePath("/leases")
    revalidatePath("/properties")
    revalidatePath("/tenants")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

export async function terminateLease(leaseId: string, roomId: string) {
  try {
    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from("leases")
      .update({ status: "terminated" })
      .eq("id", leaseId)

    if (updateError) {
      return { error: updateError.message }
    }

    // Tự động giải phóng phòng về "Trống" (available)
    await supabase.from("rooms").update({ status: "available" }).eq("id", roomId)

    revalidatePath("/leases")
    revalidatePath("/properties")
    revalidatePath("/tenants")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

export async function deleteLease(leaseId: string, roomId: string, contractFilePath?: string | null) {
  try {
    const supabase = await createClient()

    // Nếu có file đính kèm, xóa trên Storage
    if (contractFilePath) {
      await supabase.storage.from("contracts").remove([contractFilePath])
    }

    const { error } = await supabase.from("leases").delete().eq("id", leaseId)

    if (error) {
      return { error: error.message }
    }

    // Kiểm tra xem phòng còn hợp đồng active nào khác không
    const { data: otherActiveLeases } = await supabase
      .from("leases")
      .select("id")
      .eq("room_id", roomId)
      .eq("status", "active")
      .limit(1)

    if (!otherActiveLeases || otherActiveLeases.length === 0) {
      await supabase.from("rooms").update({ status: "available" }).eq("id", roomId)
    }

    revalidatePath("/leases")
    revalidatePath("/properties")
    revalidatePath("/tenants")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}

export async function getContractDownloadUrl(filePath: string) {
  try {
    const supabase = await createClient()

    // Tạo signed url có hiệu lực trong 60 phút
    const { data, error } = await supabase.storage
      .from("contracts")
      .createSignedUrl(filePath, 3600)

    if (error) {
      return { error: error.message }
    }

    return { url: data.signedUrl }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo đường dẫn xem file."
    return { error: message }
  }
}
