import { createClient } from "@/lib/supabase/server"
import { TenantsClient, type TenantWithLease } from "./tenants-client"

export const metadata = {
  title: "Khách thuê - BaoBao Stay",
}

export default async function TenantsPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("org_id").single()

  let tenants: TenantWithLease[] = []

  if (profile?.org_id) {
    const { data } = await supabase
      .from("tenants")
      .select(`
        *,
        leases (
          id,
          status,
          room:rooms (
            id,
            room_code,
            property:properties (
              id,
              name
            )
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (data) {
      tenants = data as unknown as TenantWithLease[]
    }
  }

  return <TenantsClient tenants={tenants} />
}
