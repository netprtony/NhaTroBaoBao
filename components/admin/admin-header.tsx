"use client"

import { ShieldCheck, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"

interface AdminHeaderProps {
  adminName: string
}

export function AdminHeader({ adminName }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-md">
      {/* Mobile Menu Trigger */}
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="text-slate-300 hover:bg-slate-900">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-slate-950 border-slate-800 text-slate-100">
            <AdminSidebar adminName={adminName} />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-white text-base">BaoBao Stay Admin</span>
      </div>

      {/* Title & Badge */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Kênh Quản Trị Hệ Thống Platform</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
          <span>Xin chào, <strong className="text-white">{adminName}</strong></span>
        </div>
      </div>
    </header>
  )
}
