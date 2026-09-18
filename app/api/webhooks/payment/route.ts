import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, status, txnRef, secret } = body

    // Simple webhook auth verification if webhook secret is configured
    const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "baobaostay_secret_2026"
    if (secret && secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized webhook payload" }, { status: 401 })
    }

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: payment, error: fetchErr } = await supabase
      .from("subscription_payments")
      .select("*, organizations(*)")
      .eq("id", paymentId)
      .single()

    if (fetchErr || !payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 })
    }

    if (status === "success" || status === "COMPLETED") {
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

      await supabase
        .from("subscription_payments")
        .update({
          status: "success",
          payment_gateway_txn_id: txnRef || payment.payment_gateway_txn_id,
        })
        .eq("id", paymentId)

      await supabase
        .from("organizations")
        .update({
          plan,
          plan_started_at: now.toISOString(),
          plan_expires_at: newExpiryDate.toISOString(),
          plan_status: "active",
        })
        .eq("id", orgId)

      return NextResponse.json({ success: true, message: "Subscription updated successfully" })
    } else if (status === "failed" || status === "CANCELLED") {
      await supabase
        .from("subscription_payments")
        .update({ status: "failed" })
        .eq("id", paymentId)

      return NextResponse.json({ success: true, message: "Payment marked as failed" })
    }

    return NextResponse.json({ success: true, message: "Webhook processed" })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Internal server error" }, { status: 500 })
  }
}
