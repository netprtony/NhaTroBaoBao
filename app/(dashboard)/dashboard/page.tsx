import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, CheckCircle, Users } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Dashboard - BaoBao Stay" }

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Since RLS policies will automatically restrict results to the user's organization,
  // we can simply query the tables without explicit organization_id filters, 
  // or we can fetch the user's org explicitly if RLS is not fully set up.
  
  const { count: propertiesCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    
  const totalProperties = propertiesCount || 0

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, status")
    
  let totalRooms = 0
  let availableRooms = 0
  let occupiedRooms = 0

  if (rooms) {
    totalRooms = rooms.length
    availableRooms = rooms.filter(r => r.status === "available").length
    occupiedRooms = rooms.filter(r => r.status === "occupied").length
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Tổng quan</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng nhà trọ</CardTitle>
            <div className="rounded-full p-2 bg-blue-50">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng phòng</CardTitle>
            <div className="rounded-full p-2 bg-indigo-50">
              <Home className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Phòng trống</CardTitle>
            <div className="rounded-full p-2 bg-emerald-50">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableRooms}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Đang cho thuê</CardTitle>
            <div className="rounded-full p-2 bg-amber-50">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedRooms}</div>
          </CardContent>
        </Card>
      </div>

      {totalProperties === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center bg-white">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Chưa có dữ liệu</h3>
          <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm nhà trọ đầu tiên của bạn.</p>
          <div className="mt-6">
            <Link
              href="/properties"
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Building2 className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Đi đến Quản lý Nhà trọ
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
