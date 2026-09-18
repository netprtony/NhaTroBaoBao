import { createClient } from "@/lib/supabase/server"

export class SubscriptionLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SubscriptionLimitError"
  }
}

export type PlanUsageInfo = {
  plan: "free" | "basic" | "vip" | string
  planStatus: "active" | "past_due" | "canceled" | "trialing" | string
  planExpiresAt: string | null
  isExpired: boolean
  isReadOnly: boolean
  propertiesCount: number
  maxProperties: number | null
  isAtPropertyLimit: boolean
  roomsCount: number
  maxRooms: number | null
  isAtRoomLimit: boolean
  tenantPortalEnabled: boolean
  smsNotificationEnabled: boolean
}

export async function getOrgPlanUsage(orgId: string): Promise<PlanUsageInfo> {
  const supabase = await createClient()

  // 1. Fetch organization details
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, plan_status, plan_expires_at")
    .eq("id", orgId)
    .single()

  const plan = (org?.plan || "free") as "free" | "basic" | "vip"
  const planStatus = (org?.plan_status || "active") as string
  const planExpiresAt = org?.plan_expires_at || null

  const now = new Date()
  const isExpired = planExpiresAt ? new Date(planExpiresAt) < now : false
  const isReadOnly = planStatus === "past_due" || planStatus === "canceled" || isExpired

  // 2. Fetch plan limits
  const { data: limits } = await supabase
    .from("plan_limits")
    .select("max_properties, max_rooms, max_staff, tenant_portal_enabled, sms_notification_enabled")
    .eq("plan", plan)
    .single()

  const maxProperties = limits?.max_properties ?? (plan === "free" ? 1 : plan === "basic" ? 3 : null)
  const maxRooms = limits?.max_rooms ?? (plan === "free" ? 10 : plan === "basic" ? 30 : null)
  const tenantPortalEnabled = limits?.tenant_portal_enabled ?? (plan !== "free")
  const smsNotificationEnabled = limits?.sms_notification_enabled ?? (plan === "vip")

  // 3. Count current properties and rooms
  const { count: propertiesCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)

  const { count: roomsCount } = await supabase
    .from("rooms")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)

  const pCount = propertiesCount || 0
  const rCount = roomsCount || 0

  const isAtPropertyLimit = maxProperties !== null && pCount >= maxProperties
  const isAtRoomLimit = maxRooms !== null && rCount >= maxRooms

  return {
    plan,
    planStatus,
    planExpiresAt,
    isExpired,
    isReadOnly,
    propertiesCount: pCount,
    maxProperties,
    isAtPropertyLimit,
    roomsCount: rCount,
    maxRooms,
    isAtRoomLimit,
    tenantPortalEnabled,
    smsNotificationEnabled,
  }
}

export async function assertCanCreateProperty(orgId: string) {
  const usage = await getOrgPlanUsage(orgId)

  if (usage.isReadOnly) {
    throw new SubscriptionLimitError(
      `Tài khoản của bạn đã hết hạn gói ${usage.plan.toUpperCase()} hoặc quá hạn thanh toán. Dữ liệu đang ở chế độ chỉ đọc. Vui lòng gia hạn gói để thêm nhà trọ mới.`
    )
  }

  if (usage.isAtPropertyLimit) {
    throw new SubscriptionLimitError(
      `Gói ${usage.plan.toUpperCase()} chỉ cho phép tối đa ${usage.maxProperties} nhà trọ. Bạn đã sử dụng ${usage.propertiesCount}/${usage.maxProperties} nhà trọ. Vui lòng nâng cấp gói để tạo thêm.`
    )
  }
}

export async function assertCanCreateRoom(orgId: string) {
  const usage = await getOrgPlanUsage(orgId)

  if (usage.isReadOnly) {
    throw new SubscriptionLimitError(
      `Tài khoản của bạn đã hết hạn gói ${usage.plan.toUpperCase()} hoặc quá hạn thanh toán. Dữ liệu đang ở chế độ chỉ đọc. Vui lòng gia hạn gói để thêm phòng mới.`
    )
  }

  if (usage.isAtRoomLimit) {
    throw new SubscriptionLimitError(
      `Gói ${usage.plan.toUpperCase()} chỉ cho phép tối đa ${usage.maxRooms} phòng. Bạn đã sử dụng ${usage.roomsCount}/${usage.maxRooms} phòng. Vui lòng nâng cấp gói để tạo thêm.`
    )
  }
}
