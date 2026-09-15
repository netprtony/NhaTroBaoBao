"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Building2, Users, FileText, Receipt } from "lucide-react"

const navItems = [
  { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { name: "Nhà trọ", href: "/properties", icon: Building2 },
  { name: "Khách", href: "/tenants", icon: Users },
  { name: "Hợp đồng", href: "/leases", icon: FileText },
  { name: "Hóa đơn", href: "/invoices", icon: Receipt },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full h-16 bg-white border-t border-gray-200 lg:hidden shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className="inline-flex flex-col items-center justify-center px-1 hover:bg-gray-50 group"
            >
              <item.icon
                className={cn(
                  "w-5 h-5 mb-1",
                  isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
                )}
              />
              <span
                className={cn(
                  "text-[10px] sm:text-xs text-center",
                  isActive ? "text-blue-600 font-semibold" : "text-gray-500 group-hover:text-blue-600"
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
