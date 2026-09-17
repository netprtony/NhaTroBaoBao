import { createClient } from "@/lib/supabase/server"
import { PortalNavigation } from "@/components/portal/portal-navigation"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <PortalNavigation tenantName="" orgName="">{children}</PortalNavigation>
  }

  // Fetch tenant info
  const { data: tenant } = await supabase
    .from("tenants")
    .select("full_name, org_id, portal_enabled, organizations(name)")
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  const tenantName = tenant?.full_name || "Khách thuê"
  const orgName = (tenant?.organizations as unknown as { name: string })?.name || "BaoBao Stay"

  return (
    <PortalNavigation tenantName={tenantName} orgName={orgName}>
      {children}
    </PortalNavigation>
  )
}
