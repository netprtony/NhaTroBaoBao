import { Skeleton } from "@/components/ui/skeleton"

export default function AdminOrganizationsLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 space-y-2">
        <Skeleton className="h-8 w-72 bg-slate-800" />
        <Skeleton className="h-4 w-96 bg-slate-800" />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 bg-slate-800 rounded-xl" />
          <Skeleton className="h-9 w-40 bg-slate-800 rounded-xl" />
          <Skeleton className="h-9 w-16 bg-slate-800 rounded-xl" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
