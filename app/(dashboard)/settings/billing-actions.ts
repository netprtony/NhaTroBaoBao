"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  calculatePlanAmount,
  generateVietQRUrl,
  type BillingCycle,
  type PaymentMethod,
  type SubscriptionPlan,
} from "@/lib/payment/vnpay"

export type SubscriptionOrderResult = {
  error?: string
  paymentId?: string
  amount?: number
  memo?: string
  qrUrl?: string
  plan?: SubscriptionPlan
  billingCycle?: BillingCycle
  paymentMethod?: PaymentMethod
}

export async function createSubscriptionOrder(
  plan: "basic" | "vip",
  cycle: BillingCycle,
  paymentMethod: PaymentMethod = "bank_transfer"
): Promise<SubscriptionOrderResult> {
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
      .select("org_id, organizations(slug, name)")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức của bạn." }
    }

    const orgId = profile.org_id
    const orgObj = profile.organizations as { slug?: string } | null
    const orgSlug = orgObj?.slug || orgId.slice(0, 8)
    const amount = calculatePlanAmount(plan, cycle)

    const now = new Date()
    const periodEnd = new Date(now)
    if (cycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setDate(periodEnd.getDate() + 30)
    }

    const memo = `BAOBAOSTAY ${orgSlug.toUpperCase()} ${plan.toUpperCase()} ${cycle.toUpperCase()}`.slice(0, 30)

    const { data: payment, error } = await supabase
      .from("subscription_payments")
      .insert({
        org_id: orgId,
        plan,
        amount,
        billing_cycle: cycle,
        payment_method: paymentMethod,
        payment_gateway_txn_id: `TXN_${Date.now()}`,
        status: "pending",
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
      })
      .select("id")
      .single()

    if (error || !payment) {
      console.error("Lỗi tạo hóa đơn đăng ký:", error)
      return { error: error?.message || "Không thể tạo hóa đơn thanh toán." }
    }

    const qrUrl = generateVietQRUrl(amount, memo)

    revalidatePath("/settings")

    return {
      paymentId: payment.id,
      amount,
      memo,
      qrUrl,
      plan,
      billingCycle: cycle,
      paymentMethod,
    }
  } catch (err: unknown) {
    return { error: (err as Error).message || "Lỗi hệ thống khi khởi tạo thanh toán." }
  }
}

export async function confirmSimulatedPayment(paymentId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: "Bạn chưa đăng nhập." }

    const { data: payment, error: fetchErr } = await supabase
      .from("subscription_payments")
      .select("*, organizations(*)")
      .eq("id", paymentId)
      .single()

    if (fetchErr || !payment) {
      return { error: "Không tìm thấy đơn hàng thanh toán." }
    }

    if (payment.status === "success") {
      return { message: "Đơn hàng này đã được xác nhận thanh toán trước đó." }
    }

    const orgId = payment.org_id
    const plan = payment.plan as "basic" | "vip"
    const cycle = payment.billing_cycle as "monthly" | "yearly"

    const now = new Date()
    const currentExpiry = payment.organizations?.plan_expires_at
      ? new Date(payment.organizations.plan_expires_at)
      : null

    let newExpiryDate = new Date()
    if (currentExpiry && currentExpiry > now && payment.organizations?.plan === plan) {
      newExpiryDate = new Date(currentExpiry)
    }

    if (cycle === "yearly") {
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1)
    } else {
      newExpiryDate.setDate(newExpiryDate.getDate() + 30)
    }

    // 1. Update payment record
    const { error: payUpdateErr } = await supabase
      .from("subscription_payments")
      .update({ status: "success" })
      .eq("id", paymentId)

    if (payUpdateErr) {
      return { error: payUpdateErr.message }
    }

    // 2. Update organization plan & validity
    const { error: orgUpdateErr } = await supabase
      .from("organizations")
      .update({
        plan,
        plan_started_at: now.toISOString(),
        plan_expires_at: newExpiryDate.toISOString(),
        plan_status: "active",
      })
      .eq("id", orgId)

    if (orgUpdateErr) {
      return { error: orgUpdateErr.message }
    }

    revalidatePath("/settings")
    revalidatePath("/dashboard")
    revalidatePath("/properties")
    revalidatePath("/tenants")
    revalidatePath("/invoices")

    return { message: `✓ Nâng cấp/Gia hạn thành công gói ${plan.toUpperCase()} đến ngày ${newExpiryDate.toLocaleDateString("vi-VN")}` }
  } catch (err: unknown) {
    return { error: (err as Error).message || "Lỗi khi xác nhận thanh toán." }
  }
}

export async function cancelPendingOrder(paymentId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("subscription_payments")
      .update({ status: "failed" })
      .eq("id", paymentId)

    if (error) return { error: error.message }

    revalidatePath("/settings")
    return { message: "Đã hủy đơn hàng thanh toán." }
  } catch (err: unknown) {
    return { error: (err as Error).message || "Không thể hủy đơn hàng." }
  }
}

export async function getOrgPaymentHistory() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) return []

  const { data: payments } = await supabase
    .from("subscription_payments")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false })

  return payments || []
}
