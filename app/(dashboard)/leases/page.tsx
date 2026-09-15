import { createClient } from "@/lib/supabase/server"
import {
  LeasesClient,
  type LeaseWithDetails,
} from "./leases-client"
import { type SelectableRoom, type SelectableTenant } from "@/components/leases/lease-form-dialog"

export const metadata = {
  title: "Hợp đồng thuê - BaoBao Stay",
}

export default async function LeasesPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("org_id").single()

  let leases: LeaseWithDetails[] = []
  let selectableRooms: SelectableRoom[] = []
  let selectableTenants: SelectableTenant[] = []

  if (profile?.org_id) {
    // 1. Fetch danh sách hợp đồng
    const { data: leasesData } = await supabase
      .from("leases")
      .select(`
        *,
        tenant:tenants (
          id,
          full_name,
          phone
        ),
        room:rooms (
          id,
          room_code,
          property:properties (
            id,
            name
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (leasesData) {
      leases = leasesData as unknown as LeaseWithDetails[]
    }

    // 2. Fetch danh sách phòng CÒN TRỐNG của tổ chức để chọn khi tạo hợp đồng
    const { data: roomsData } = await supabase
      .from("rooms")
      .select(`
        id,
        room_code,
        base_price,
        status,
        property:properties (
          name
        )
      `)
      .eq("org_id", profile.org_id)
      .eq("status", "available")
      .order("room_code", { ascending: true })

    if (roomsData) {
      selectableRooms = roomsData.map((r) => {
        const prop = r.property as { name?: string } | null
        return {
          id: r.id,
          room_code: r.room_code,
          base_price: r.base_price,
          status: r.status,
          propertyName: prop?.name || "Nhà trọ",
        }
      })
    }

    // 3. Fetch danh sách khách thuê CHƯA CÓ HỢP ĐỒNG ĐANG HOẠT ĐỘNG của tổ chức
    // Lấy danh sách tenant_id đang đứng tên hợp đồng active
    const { data: activeLeasesData } = await supabase
      .from("leases")
      .select("tenant_id")
      .eq("org_id", profile.org_id)
      .eq("status", "active")

    const activeTenantIds = new Set((activeLeasesData || []).map((l) => l.tenant_id))

    // Lấy toàn bộ khách thuê của tổ chức
    const { data: tenantsData } = await supabase
      .from("tenants")
      .select("id, full_name, phone")
      .eq("org_id", profile.org_id)
      .order("full_name", { ascending: true })

    if (tenantsData) {
      // Chỉ load những khách thuê chưa có hợp đồng active nào (kể cả khách chưa từng có hợp đồng hoặc khách đã thanh lý hợp đồng)
      selectableTenants = tenantsData.filter((t) => !activeTenantIds.has(t.id))
    }
  }

  return (
    <LeasesClient
      leases={leases}
      rooms={selectableRooms}
      tenants={selectableTenants}
    />
  )
}
