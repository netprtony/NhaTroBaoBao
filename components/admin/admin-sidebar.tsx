/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building2, CreditCard, LogOut, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { logout } from "@/app/(auth)/actions"

interface AdminSidebarProps {
  adminName: string
}

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Tổng quan",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Quản lý Tổ chức",
      href: "/admin/organizations",
      icon: Building2,
    },
    {
      title: "Quản lý Đăng ký",
      href: "/admin/subscriptions",
      icon: CreditCard,
    },
  ]

  return (
    <div className="flex h-full w-64 flex-col bg-slate-950 border-r border-slate-800 text-slate-200">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <Image
          src="/mainlogo-removebg-preview.webp"
          alt="BaoBao Stay Logo"
          width={48}
          height={48}
          className="h-12 w-12 object-contain shrink-0"
        />
        <div>
          <span className="font-bold text-white text-base tracking-wide block leading-tight">
            BaoBao Stay
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-violet-400 bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-800/50 inline-block mt-0.5">
            SuperAdmin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1.5 p-4">
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Hệ thống Nền tảng
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
              {item.title}
            </Link>
          )
        }
        )}
      </div>

      {/* Footer Profile & Logout */}
      <div className="border-t border-slate-800/80 p-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-xs">
            {adminName?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{adminName}</p>
            <p className="text-[10px] text-violet-400">Platform Admin</p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors border border-transparent hover:border-rose-900/40"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất Admin
          </button>
        </form>
      </div>
    </div>
  )
}
