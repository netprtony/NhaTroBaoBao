export type SubscriptionPlan = "free" | "basic" | "vip"
export type BillingCycle = "monthly" | "yearly"
export type PaymentMethod = "bank_transfer" | "vnpay" | "momo"

export const PLAN_PRICES = {
  free: {
    monthly: 0,
    yearly: 0,
    name: "Gói Free",
  },
  basic: {
    monthly: 99000,
    yearly: 990000, // ~82,500/tháng (Tiết kiệm 17%)
    name: "Gói Basic",
  },
  vip: {
    monthly: 249000,
    yearly: 2490000, // ~207,500/tháng (Tiết kiệm 17%)
    name: "Gói VIP",
  },
} as const

export const PLATFORM_BANK_INFO = {
  bankId: "MBBank",
  bankCode: "MB",
  accountNo: "0334848398",
  accountName: "NGUYEN HOANG BAO",
}

export function calculatePlanAmount(plan: "basic" | "vip", cycle: BillingCycle): number {
  return PLAN_PRICES[plan][cycle]
}

export function generateVietQRUrl(amount: number, memo: string): string {
  const bank = PLATFORM_BANK_INFO.bankCode
  const account = PLATFORM_BANK_INFO.accountNo
  const name = encodeURIComponent(PLATFORM_BANK_INFO.accountName)
  const info = encodeURIComponent(memo)
  return `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${name}`
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}
