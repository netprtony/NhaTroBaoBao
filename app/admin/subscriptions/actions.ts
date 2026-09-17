"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function manualRenewSubscription(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: "Bạn chưa đăng nhập." }

    // Verify platform admin
    const { data: admin } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!admin) {
      return { error: "Bạn không có quyền thực hiện thao tác Superadmin." }
    }

    const orgId = formData.get("orgId") as string
    const plan = (formData.get("plan") as "free" | "basic" | "vip") || "basic"
    const months = parseInt((formData.get("months") as string) || "1", 10)
    const rawAmount = formData.get("amount") as string
    const amount = rawAmount ? parseInt(rawAmount, 10) : 0
    const reason = (formData.get("reason") as string) || "Gia hạn thủ công từ Admin"

    if (!orgId) return { error: "Thiếu thông tin tổ chức." }

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*, plan_expires_at")
      .eq("id", orgId)
      .single()

    if (orgErr || !org) return { error: "Tổ chức không tồn tại." }

    const now = new Date()
    const currentExpiry = org.plan_expires_at ? new Date(org.plan_expires_at) : null

    let newExpiryDate = new Date()
    if (currentExpiry && currentExpiry > now && org.plan === plan) {
      newExpiryDate = new Date(currentExpiry)
    }
    newExpiryDate.setMonth(newExpiryDate.getMonth() + months)

    // 1. Update organization
    const { error: updateErr } = await supabase
      .from("organizations")
      .update({
        plan,
        plan_started_at: now.toISOString(),
        plan_expires_at: plan === "free" ? null : newExpiryDate.toISOString(),
        plan_status: "active",
      })
      .eq("id", orgId)

    if (updateErr) return { error: updateErr.message }

    // 2. Insert payment record if not free
    if (plan !== "free") {
      const periodStart = now
      const periodEnd = newExpiryDate

      await supabase.from("subscription_payments").insert({
        org_id: orgId,
        plan,
        amount,
        billing_cycle: months >= 12 ? "yearly" : "monthly",
        payment_method: "bank_transfer",
        payment_gateway_txn_id: `MANUAL_RENEW_${Date.now()}`,
        status: "success",
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      })
    }

    revalidatePath("/admin/subscriptions")
    revalidatePath("/admin/organizations")
    revalidatePath("/admin/dashboard")

    return { success: true, message: `✓ Đã gia hạn ${months} tháng gói ${plan.toUpperCase()} cho tổ chức thành công!` }
  } catch (err: any) {
    return { error: err.message || "Lỗi khi gia hạn thủ công." }
  }
}

export async function changeOrgPlanDirectly(orgId: string, newPlan: "free" | "basic" | "vip") {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: "Bạn chưa đăng nhập." }

    const { data: admin } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!admin) return { error: "Không có quyền thao tác." }

    const now = new Date()
    let planExpiresAt: string | null = null

    if (newPlan !== "free") {
      const defaultExp = new Date(now)
      defaultExp.setMonth(defaultExp.getMonth() + 1)
      planExpiresAt = defaultExp.toISOString()
    }

    const { error } = await supabase
      .from("organizations")
      .update({
        plan: newPlan,
        plan_started_at: now.toISOString(),
        plan_expires_at: planExpiresAt,
        plan_status: "active",
      })
      .eq("id", orgId)

    if (error) return { error: error.message }

    revalidatePath("/admin/subscriptions")
    revalidatePath("/admin/organizations")

    return { success: true, message: `✓ Đã chuyển tổ chức sang gói ${newPlan.toUpperCase()}` }
  } catch (err: any) {
    return { error: err.message || "Không thể chuyển gói." }
  }
}
