import { createClient } from "@/lib/supabase/server"
import { PropertiesClient, type PropertyWithCount } from "./properties-client"

export const metadata = { title: "Nhà trọ - BaoBao Stay" }

export default async function PropertiesPage() {
  const supabase = await createClient()

  // First check if user has a profile/org_id to prevent RLS errors if they don't
  const { data: profile } = await supabase.from("profiles").select("org_id").single()
  
  let properties: PropertyWithCount[] = []
  
  if (profile?.org_id) {
    const { data } = await supabase
      .from("properties")
      .select("*, rooms(count)")
      .order("created_at", { ascending: false })
      
    if (data) {
      properties = data
    }
  }

  return <PropertiesClient properties={properties} />
}
