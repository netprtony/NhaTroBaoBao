import { createClient } from "@/lib/supabase/server"
import { AdminSubscriptionsClient } from "@/components/admin/admin-subscriptions-client"

export const metadata = {
  title: "Quản lý Subscription - SuperAdmin BaoBao Stay",
}

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()

  // Fetch all organizations with owner profile and payment records
  const { data: organizations } = await supabase
    .from("organizations")
    .select("*, profiles(*), subscription_payments(*)")
    .order("created_at", { ascending: false })

  const orgList = organizations || []

  // Calculate MRR & Total Revenue
  let mrr = 0
  let totalRevenue = 0
  let paidCount = 0
  let expiringSoonCount = 0

  const now = new Date()
  const sevenDaysLater = new Date(now)
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

  orgList.forEach((org) => {
    const isPaid = org.plan === "basic" || org.plan === "vip"
    if (isPaid && org.plan_status === "active") {
      paidCount++
      if (org.plan === "basic") mrr += 99000
      if (org.plan === "vip") mrr += 249000
    }

    if (org.plan_expires_at) {
      const exp = new Date(org.plan_expires_at)
      if (exp >= now && exp <= sevenDaysLater) {
        expiringSoonCount++
      }
    }

    if (org.subscription_payments) {
      org.subscription_payments.forEach((p: any) => {
        if (p.status === "success") {
          totalRevenue += p.amount || 0
        }
      })
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">Quản lý Đăng ký Gói (Subscriptions)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Theo dõi danh sách khách hàng, tình trạng gói cước, gia hạn thủ công và doanh thu nền tảng.
        </p>
      </div>

      <AdminSubscriptionsClient
        organizations={orgList}
        mrr={mrr}
        totalRevenue={totalRevenue}
        paidCount={paidCount}
        expiringSoonCount={expiringSoonCount}
      />
    </div>
  )
}
