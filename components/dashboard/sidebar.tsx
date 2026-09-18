"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Building2, Users, FileText, Receipt, Zap, Settings, LogOut } from "lucide-react"
import { logout } from "@/app/(auth)/actions"

interface SidebarProps {
  orgName: string
  userName: string
  userRole: string
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, disabled: false },
  { name: "Nhà trọ", href: "/properties", icon: Building2, disabled: false },
  { name: "Khách thuê", href: "/tenants", icon: Users, disabled: false },
  { name: "Hợp đồng", href: "/leases", icon: FileText, disabled: false },
  { name: "Điện & Nước", href: "/utility-readings", icon: Zap, disabled: false },
  { name: "Hóa đơn", href: "/invoices", icon: Receipt, disabled: false },
  { name: "Cài đặt", href: "/settings", icon: Settings, disabled: false },
]

export function Sidebar({ orgName, userName, userRole }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col overflow-y-auto border-r bg-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b gap-2.5">
        <Image
          src="/mainlogo-removebg-preview.webp"
          alt="BaoBao Stay Logo"
          width={44}
          height={44}
          className="h-11 w-11 object-contain shrink-0"
        />
        <span className="text-xl font-bold tracking-tight text-slate-900">BaoBao Stay</span>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
              aria-disabled={item.disabled}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <div className="mb-4 px-2">
          <p className="text-sm font-medium text-gray-900 truncate">{orgName}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 truncate">{userName}</p>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
              {userRole}
            </span>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
            Đăng xuất
          </button>
        </form>
      </div>
    </div>
  )
}
