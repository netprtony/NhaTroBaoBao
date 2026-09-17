import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UtilityReadingsClient, type PropertyWithRooms, type MeterReadingRow } from "@/components/utility-readings/utility-readings-client"

export const metadata = {
  title: "Chỉ số Điện Nước - BaoBao Stay",
}

export default async function UtilityReadingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("org_id").single()
  if (!profile?.org_id) {
    redirect("/dashboard")
  }

  // Fetch organization settings for default prices
  const { data: org } = await supabase
    .from("organizations")
    .select("default_electricity_price, default_water_price")
    .eq("id", profile.org_id)
    .single()

  const defaultElecPrice = org?.default_electricity_price || 3500
  const defaultWaterPrice = org?.default_water_price || 20000

  // Fetch properties with rooms & active leases
  const { data: propertiesData } = await supabase
    .from("properties")
    .select(`
      *,
      rooms (
        *,
        leases (
          id,
          status,
          tenant:tenants (
            full_name
          )
        )
      )
    `)
    .eq("org_id", profile.org_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const properties = (propertiesData || []) as unknown as PropertyWithRooms[]

  // Current default period (MM/YYYY)
  const now = new Date()
  const monthStr = (now.getMonth() + 1).toString().padStart(2, "0")
  const yearStr = now.getFullYear().toString()
  const defaultPeriod = `${monthStr}/${yearStr}`

  // Previous month period (MM/YYYY) for auto-filling old values
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStr = (prevMonth.getMonth() + 1).toString().padStart(2, "0")
  const prevYearStr = prevMonth.getFullYear().toString()
  const prevPeriod = `${prevMonthStr}/${prevYearStr}`

  // Fetch existing meter readings
  const { data: existingReadingsData } = await supabase
    .from("meter_readings")
    .select("*")
    .eq("org_id", profile.org_id)

  const existingReadings = (existingReadingsData || []) as MeterReadingRow[]

  const currentMonthReadings = existingReadings.filter((r) => r.period === defaultPeriod)
  const previousMonthReadings = existingReadings.filter((r) => r.period === prevPeriod)

  return (
    <UtilityReadingsClient
      properties={properties}
      existingReadings={currentMonthReadings}
      previousReadings={previousMonthReadings}
      defaultPeriod={defaultPeriod}
      defaultElecPrice={defaultElecPrice}
      defaultWaterPrice={defaultWaterPrice}
    />
  )
}
