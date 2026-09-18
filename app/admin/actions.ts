"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ActionState = { error?: string; success?: boolean; message?: string } | null

export async function toggleOrgSuspensionAction(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()

    const orgId = formData.get("orgId") as string
    const actionType = formData.get("actionType") as string // "suspend" | "unsuspend"
    const reason = (formData.get("reason") as string)?.trim() || null

    if (!orgId) {
      return { error: "Không tìm thấy thông tin tổ chức." }
    }

    const isSuspend = actionType === "suspend"

    if (isSuspend && !reason) {
      return { error: "Vui lòng nhập lý do tạm khóa tổ chức." }
    }

    // Call the security definer RPC function admin_toggle_org_suspension
    const { error: rpcError } = await (
      supabase as unknown as {
        rpc: (
          fn: string,
          args: { p_org_id: string; p_suspend: boolean; p_reason: string | null }
        ) => Promise<{ error: { message: string } | null }>
      }
    ).rpc("admin_toggle_org_suspension", {
      p_org_id: orgId,
      p_suspend: isSuspend,
      p_reason: reason,
    })

    if (rpcError) {
      return { error: `Lỗi thao tác Superadmin: ${rpcError.message}` }
    }

    revalidatePath("/admin/organizations")
    revalidatePath(`/admin/organizations/${orgId}`)
    revalidatePath("/admin/dashboard")

    return {
      success: true,
      message: isSuspend
        ? "Đã tạm khóa quyền truy cập của tổ chức thành công."
        : "Đã mở khóa hoạt động cho tổ chức thành công.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
    return { error: message }
  }
}
