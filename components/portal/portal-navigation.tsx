"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Receipt, FileText, Zap, Settings, LogOut, Building2 } from "lucide-react"
import { portalLogout } from "@/app/portal/actions"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface PortalNavigationProps {
  tenantName: string
  orgName: string
  children: React.ReactNode
}

export function PortalNavigation({ tenantName, orgName, children }: PortalNavigationProps) {
  const pathname = usePathname()

  // Skip rendering portal layout frame on login page
  if (pathname === "/portal/login") {
    return <>{children}</>
  }

  const navItems = [
    { label: "Tổng quan", href: "/portal/dashboard", icon: LayoutDashboard },
    { label: "Hóa đơn", href: "/portal/invoices", icon: Receipt },
    { label: "Hợp đồng", href: "/portal/contract", icon: FileText },
    { label: "Chỉ số", href: "/portal/meter-readings", icon: Zap },
    { label: "Cài đặt", href: "/portal/settings", icon: Settings },
  ]

  const initial = tenantName ? tenantName.charAt(0).toUpperCase() : "K"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800 fixed inset-y-0 z-30">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <Image
            src="/mainlogo-removebg-preview.webp"
            alt="BaoBao Stay Logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain shrink-0"
          />
          <div>
            <h2 className="font-bold text-white text-sm truncate">{orgName || "Cổng Khách Thuê"}</h2>
            <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Khách thuê
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/portal/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar className="h-8 w-8 border border-blue-500/30">
              <AvatarFallback className="bg-blue-950 text-blue-300 font-bold text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{tenantName}</p>
              <p className="text-[10px] text-slate-400 truncate">Khách ở trọ</p>
            </div>
          </div>
          <form action={portalLogout}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-bold text-white text-xs truncate max-w-[180px]">{orgName || "Cổng Khách Thuê"}</h1>
            <span className="text-[10px] text-blue-400 font-medium">Khách ở trọ</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-medium max-w-[100px] truncate">{tenantName}</span>
          <form action={portalLogout}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 min-h-screen p-4 md:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Tabbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/portal/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all text-[11px] font-medium",
                isActive
                  ? "text-blue-400 font-semibold bg-blue-500/10"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-blue-400" : "text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
