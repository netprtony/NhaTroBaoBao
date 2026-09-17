"use client"

import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RoomFormDialog } from "@/components/rooms/room-form-dialog"
import { RoomCard } from "@/components/rooms/room-card"
import { Tables } from "@/types/database.types"
import { PlanLimitBanner } from "@/components/dashboard/plan-limit-banner"
import { type PlanUsageInfo } from "@/lib/subscription/check-limit"

type PropertyDetailClientProps = {
  property: Tables<"properties">
  rooms: Tables<"rooms">[]
  usage?: PlanUsageInfo | null
}

export function PropertyDetailClient({ property, rooms, usage }: PropertyDetailClientProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
          <p className="text-muted-foreground">{property.address}</p>
        </div>
      </div>

      {property.description && (
        <div className="bg-muted/30 p-4 rounded-lg">
          <p className="text-sm">{property.description}</p>
        </div>
      )}

      {usage && <PlanLimitBanner usage={usage} compact />}

      <div className="flex items-center justify-between pt-6 border-t">
        <h2 className="text-2xl font-semibold tracking-tight">Danh sách phòng</h2>
        <RoomFormDialog
          propertyId={property.id}
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm phòng
            </Button>
          }
        />
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/50">
          <h3 className="text-lg font-medium">Chưa có phòng nào</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Bắt đầu bằng cách thêm phòng đầu tiên cho nhà trọ này.
          </p>
          <RoomFormDialog
            propertyId={property.id}
            trigger={<Button>Thêm phòng</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}
