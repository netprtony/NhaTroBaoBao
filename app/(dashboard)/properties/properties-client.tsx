"use client"

import Link from "next/link"
import { Building, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PropertyFormDialog } from "@/components/properties/property-form-dialog"
import { DeletePropertyDialog } from "@/components/properties/delete-property-dialog"
import { Tables } from "@/types/database.types"

type RoomCount = { count: number }

export type PropertyWithCount = Tables<"properties"> & {
  rooms?: RoomCount[] | RoomCount | null
}

export function PropertiesClient({ properties }: { properties: PropertyWithCount[] }) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Nhà trọ</h1>
        <PropertyFormDialog
          trigger={<Button>Thêm nhà trọ</Button>}
        />
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/50">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Chưa có nhà trọ nào</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Bắt đầu bằng cách thêm nhà trọ đầu tiên của bạn.
          </p>
          <PropertyFormDialog
            trigger={<Button>Thêm nhà trọ</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            let count = 0
            if (Array.isArray(property.rooms) && property.rooms.length > 0) {
              count = property.rooms[0]?.count || 0
            } else if (property.rooms && typeof property.rooms === "object" && "count" in property.rooms) {
              count = Number(property.rooms.count) || 0
            }

            return (
              <Card key={property.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{property.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {property.address}
                  </p>
                  <div className="text-sm font-medium">
                    Số phòng: {count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Tạo ngày: {new Date(property.created_at).toLocaleDateString("vi-VN")}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/properties/${property.id}`}>
                      Xem chi tiết
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    <PropertyFormDialog
                      property={property}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DeletePropertyDialog
                      propertyId={property.id}
                      propertyName={property.name}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
