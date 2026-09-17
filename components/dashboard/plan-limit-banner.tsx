"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, Crown, Sparkles, ShieldAlert, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type PlanUsageInfo } from "@/lib/subscription/check-limit"

type PlanLimitBannerProps = {
  usage: PlanUsageInfo
  compact?: boolean
}

export function PlanLimitBanner({ usage, compact = false }: PlanLimitBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const isFree = usage.plan === "free"
  const isBasic = usage.plan === "basic"
  const isVip = usage.plan === "vip"

  // 1. Cảnh báo tài khoản Hết hạn / Quá hạn (Chế độ Chỉ đọc)
  if (usage.isReadOnly) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-red-900/90 via-red-800 to-amber-900 p-4 text-white shadow-lg border border-red-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500/20 shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert className="h-5 w-5 text-red-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-sm">
              <span>Tài khoản ở chế độ Chỉ đọc (Read-only)</span>
              <Badge className="bg-red-500/30 text-red-200 border-red-400/30 text-[10px] uppercase">
                {usage.planStatus === "past_due" ? "Quá hạn thanh toán" : "Hết hạn sử dụng"}
              </Badge>
            </div>
            <p className="text-xs text-red-100 mt-1">
              Gói {usage.plan.toUpperCase()} của bạn đã hết hạn. Tất cả dữ liệu vẫn được bảo vệ an toàn trên hệ thống. Gia hạn gói ngay để mở khóa chức năng tạo mới nhà trọ, phòng trọ và thu tiền.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button asChild size="sm" className="bg-white text-red-900 hover:bg-red-50 font-bold text-xs gap-1 shadow">
            <Link href="/settings">
              <Crown className="h-3.5 w-3.5 text-amber-600" />
              Gia hạn / Nâng cấp ngay
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Nếu là gói VIP không giới hạn và không quá hạn -> Không cần hiện banner giới hạn
  if (isVip && !usage.isReadOnly) return null

  const roomRatio = usage.maxRooms ? usage.roomsCount / usage.maxRooms : 0
  const isNearRoomLimit = roomRatio >= 0.8
  const showBanner = usage.isAtPropertyLimit || usage.isAtRoomLimit || isNearRoomLimit || isFree

  if (!showBanner) return null

  // Tính phần trăm sử dụng phòng
  const roomPercentage = usage.maxRooms ? Math.min(100, Math.round(roomRatio * 100)) : 0

  return (
    <div
      className={`rounded-xl border transition-all ${
        usage.isAtRoomLimit || usage.isAtPropertyLimit
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-blue-50/70 border-blue-200 text-blue-900"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 w-full sm:w-auto">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              usage.isAtRoomLimit || usage.isAtPropertyLimit ? "bg-amber-500/20 text-amber-700" : "bg-blue-500/20 text-blue-700"
            }`}
          >
            {usage.isAtRoomLimit || usage.isAtPropertyLimit ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">
                {usage.isAtRoomLimit
                  ? `Bạn đã đạt hạn mức tối đa ${usage.maxRooms} phòng!`
                  : usage.isAtPropertyLimit
                  ? `Bạn đã đạt hạn mức tối đa ${usage.maxProperties} nhà trọ!`
                  : `Đang sử dụng Gói ${usage.plan.toUpperCase()}`}
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-semibold bg-white">
                Gói {usage.plan}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 flex-wrap">
              <span>
                Nhà trọ: <strong>{usage.propertiesCount}/{usage.maxProperties ?? "∞"}</strong>
              </span>
              <span>
                Phòng trọ: <strong>{usage.roomsCount}/{usage.maxRooms ?? "∞"}</strong>
              </span>
            </div>

            {/* Thanh tiến trình phần trăm phòng */}
            {usage.maxRooms && (
              <div className="w-full max-w-xs bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    roomPercentage >= 100
                      ? "bg-red-600"
                      : roomPercentage >= 80
                      ? "bg-amber-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${roomPercentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1 shadow-sm">
            <Link href="/settings">
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              Nâng cấp gói <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>

          {compact && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-600"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
