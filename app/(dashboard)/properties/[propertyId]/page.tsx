import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PropertyDetailClient } from "./property-detail-client"

export const metadata = { title: "Chi tiết nhà trọ - BaoBao Stay" }

type Props = {
  params: Promise<{ propertyId: string }>
}

export default async function PropertyDetailPage({ params }: Props) {
  const { propertyId } = await params
  const supabase = await createClient()

  // First check if user has a profile/org_id
  const { data: profile } = await supabase.from("profiles").select("org_id").single()
  
  if (!profile?.org_id) {
    notFound()
  }

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single()

  if (!property) {
    notFound()
  }

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("property_id", propertyId)
    .order("room_code")

  return <PropertyDetailClient property={property} rooms={rooms || []} />
}
