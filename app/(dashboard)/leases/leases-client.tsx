"use client"

import { useState } from "react"
import { Search, FilePlus, FileText, Calendar, DollarSign, User, Home, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaseFormDialog, type SelectableRoom, type SelectableTenant } from "@/components/leases/lease-form-dialog"
import { TerminateLeaseDialog } from "@/components/leases/terminate-lease-dialog"
import { DeleteLeaseDialog } from "@/components/leases/delete-lease-dialog"
import { ContractFileButton } from "@/components/leases/contract-file-button"
import { Tables } from "@/types/database.types"

export type LeaseWithDetails = Tables<"leases"> & {
  tenant: {
    id: string
    full_name: string
    phone: string
  } | null
  room: {
    id: string
    room_code: string
    property: {
      id: string
      name: string
    } | null
  } | null
}

interface LeasesClientProps {
  leases: LeaseWithDetails[]
  rooms: SelectableRoom[]
  tenants: SelectableTenant[]
}

export function LeasesClient({ leases, rooms, tenants }: LeasesClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusTab, setStatusTab] = useState("all")

  const filteredLeases = leases.filter((lease) => {
    // Filter by status tab
    if (statusTab !== "all" && lease.status !== statusTab) {
      return false
    }

    // Filter by search term
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true

    const tenantName = lease.tenant?.full_name?.toLowerCase() || ""
    const tenantPhone = lease.tenant?.phone?.toLowerCase() || ""
    const roomCode = lease.room?.room_code?.toLowerCase() || ""
    const propertyName = lease.room?.property?.name?.toLowerCase() || ""

    return (
      tenantName.includes(term) ||
      tenantPhone.includes(term) ||
      roomCode.includes(term) ||
      propertyName.includes(term)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Đang thuê
          </Badge>
        )
      case "terminated":
        return (
          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
            Đã thanh lý
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="destructive" className="bg-rose-500 text-white">
            Hết hạn
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const activeCount = leases.filter((l) => l.status === "active").length
  const terminatedCount = leases.filter((l) => l.status === "terminated").length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hợp đồng thuê</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý hợp đồng thuê phòng, thời hạn, tiền cọc và file hợp đồng đã ký kết.
          </p>
        </div>
        <LeaseFormDialog
          rooms={rooms}
          tenants={tenants}
          trigger={
            <Button className="gap-2 shadow-sm bg-blue-600 hover:bg-blue-700">
              <FilePlus className="h-4 w-4" />
              Tạo hợp đồng mới
            </Button>
          }
        />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="all">Tất cả ({leases.length})</TabsTrigger>
            <TabsTrigger value="active">Đang thuê ({activeCount})</TabsTrigger>
            <TabsTrigger value="terminated">Đã kết thúc ({terminatedCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo khách, số phòng, nhà..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid of Lease Cards */}
      {filteredLeases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-white shadow-sm">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">
            {searchTerm ? "Không tìm thấy hợp đồng phù hợp" : "Chưa có hợp đồng nào"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            {searchTerm
              ? "Hãy thử tìm kiếm với tên khách thuê hoặc mã số phòng khác."
              : "Tạo hợp đồng đầu tiên để theo dõi thời hạn thuê và gắn khách vào phòng."}
          </p>
          {!searchTerm && (
            <LeaseFormDialog
              rooms={rooms}
              tenants={tenants}
              trigger={
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <FilePlus className="h-4 w-4" />
                  Tạo hợp đồng mới
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeases.map((lease) => {
            const propertyName = lease.room?.property?.name || "Nhà trọ"
            const roomCode = lease.room?.room_code || "---"
            const tenantName = lease.tenant?.full_name || "Khách thuê"
            const tenantPhone = lease.tenant?.phone || ""

            return (
              <Card key={lease.id} className="flex flex-col border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Home className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[160px]">{propertyName}</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Phòng {roomCode}
                      </CardTitle>
                    </div>
                    {getStatusBadge(lease.status)}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 pt-4 text-sm">
                  {/* Khách thuê */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900">{tenantName}</span>
                      {tenantPhone && (
                        <span className="text-muted-foreground ml-1.5">({tenantPhone})</span>
                      )}
                    </div>
                  </div>

                  {/* Thời hạn */}
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs space-y-0.5">
                      <p className="text-slate-600">
                        Từ: <strong className="text-slate-800">{lease.start_date ? new Date(lease.start_date).toLocaleDateString("vi-VN") : "---"}</strong>
                      </p>
                      <p className="text-slate-600">
                        Đến: <strong className="text-slate-800">{lease.end_date ? new Date(lease.end_date).toLocaleDateString("vi-VN") : "Vô thời hạn"}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Tiền thuê & Tiền cọc */}
                  <div className="flex items-start gap-2 pt-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1 w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tiền thuê/tháng:</span>
                        <span className="font-bold text-blue-600 text-sm">
                          {formatVND(lease.monthly_rent)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tiền cọc:</span>
                        <span className="font-semibold text-slate-700">
                          {formatVND(lease.deposit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* File đính kèm */}
                  {lease.contract_file_url && (
                    <div className="pt-2 border-t">
                      <ContractFileButton filePath={lease.contract_file_url} />
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t flex items-center justify-between gap-2 bg-slate-50/20">
                  {lease.status === "active" ? (
                    <TerminateLeaseDialog
                      leaseId={lease.id}
                      roomId={lease.room_id}
                      roomCode={roomCode}
                      tenantName={tenantName}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                        >
                          <AlertCircle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                          Thanh lý hợp đồng
                        </Button>
                      }
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Hợp đồng đã đóng</span>
                  )}

                  <DeleteLeaseDialog
                    leaseId={lease.id}
                    roomId={lease.room_id}
                    roomCode={roomCode}
                    tenantName={tenantName}
                    contractFilePath={lease.contract_file_url}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Xóa
                      </Button>
                    }
                  />
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
