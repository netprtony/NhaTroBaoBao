import { Skeleton } from "@/components/ui/skeleton"

export default function PortalDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 space-y-2">
        <Skeleton className="h-8 w-56 bg-slate-800" />
        <Skeleton className="h-4 w-80 bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
          <Skeleton className="h-5 w-32 bg-slate-800" />
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <Skeleton className="h-4 w-64 bg-slate-800" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
          <Skeleton className="h-5 w-32 bg-slate-800" />
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <Skeleton className="h-4 w-64 bg-slate-800" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <Skeleton className="h-6 w-44 bg-slate-800" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
