import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 bg-slate-800" />
          <Skeleton className="h-4 w-64 bg-slate-800" />
        </div>
        <Skeleton className="h-9 w-48 bg-slate-800 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 bg-slate-800" />
              <Skeleton className="h-9 w-9 rounded-xl bg-slate-800" />
            </div>
            <Skeleton className="h-9 w-16 bg-slate-800" />
            <Skeleton className="h-3 w-40 bg-slate-800" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <Skeleton className="h-6 w-48 bg-slate-800" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
