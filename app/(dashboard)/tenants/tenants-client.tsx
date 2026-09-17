"use client"

import { useState } from "react"
import { Search, UserPlus, Users, Phone, Mail, CreditCard, Home, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TenantFormDialog } from "@/components/tenants/tenant-form-dialog"
import { DeleteTenantDialog } from "@/components/tenants/delete-tenant-dialog"
import { TenantPortalDialog } from "@/components/tenants/tenant-portal-dialog"
import { Tables } from "@/types/database.types"

export type ActiveLeaseInfo = {
  id: string
  status: string
  room?: {
    id: string
    room_code: string
    property?: {
      id: string
      name: string
    } | null
  } | null
}

export type TenantWithLease = Tables<"tenants"> & {
  leases?: ActiveLeaseInfo[] | null
}

export function TenantsClient({ tenants }: { tenants: TenantWithLease[] }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTenants = tenants.filter((tenant) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    return (
      tenant.full_name.toLowerCase().includes(term) ||
      tenant.phone.toLowerCase().includes(term) ||
      (tenant.id_card_number && tenant.id_card_number.toLowerCase().includes(term)) ||
      (tenant.email && tenant.email.toLowerCase().includes(term))
    )
  })

  // Tìm hợp đồng active của khách nếu có
  const getActiveRoom = (tenant: TenantWithLease) => {
    if (!tenant.leases || tenant.leases.length === 0) return null
    const active = tenant.leases.find((l) => l.status === "active")
    if (!active?.room) return null
    return {
      roomCode: active.room.room_code,
      propertyName: active.room.property?.name || "Nhà trọ",
    }
  }

  const totalTenants = tenants.length
  const rentingTenants = tenants.filter((t) => getActiveRoom(t) !== null).length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Khách thuê</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh sách khách thuê, căn cước công dân và thông tin liên hệ.
          </p>
        </div>
        <TenantFormDialog
          trigger={
            <Button className="gap-2 shadow-sm bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4" />
              Thêm khách thuê
            </Button>
          }
        />
      </div>

      {/* Quick stats & search */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng khách thuê</p>
              <p className="text-xl font-bold text-slate-900">{totalTenants}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đang thuê phòng</p>
              <p className="text-xl font-bold text-slate-900">{rentingTenants}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chưa có phòng</p>
              <p className="text-xl font-bold text-slate-900">{totalTenants - rentingTenants}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, SĐT, CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      {filteredTenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-white shadow-sm">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">
            {searchTerm ? "Không tìm thấy khách thuê phù hợp" : "Chưa có khách thuê nào"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            {searchTerm
              ? "Hãy thử tìm kiếm với từ khóa khác như số điện thoại hoặc họ tên."
              : "Thêm hồ sơ khách thuê đầu tiên để bắt đầu tạo hợp đồng thuê phòng."}
          </p>
          {!searchTerm && (
            <TenantFormDialog
              trigger={
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4" />
                  Thêm khách thuê
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Khách thuê</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>CCCD / CMND</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phòng đang thuê</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => {
                const roomInfo = getActiveRoom(tenant)
                const initial = tenant.full_name.charAt(0).toUpperCase()

                return (
                  <TableRow key={tenant.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{tenant.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Đã thêm: {new Date(tenant.created_at).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`tel:${tenant.phone}`} className="hover:underline hover:text-blue-600">
                          {tenant.phone}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.id_card_number ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{tenant.id_card_number}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Chưa cập nhật</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[180px]">{tenant.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Chưa cập nhật</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {roomInfo ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                          {roomInfo.propertyName} - P.{roomInfo.roomCode}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                          Chưa có phòng
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TenantPortalDialog tenant={tenant} />
                        <TenantFormDialog
                          tenant={tenant}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-blue-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DeleteTenantDialog
                          tenantId={tenant.id}
                          tenantName={tenant.full_name}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
