import { Skeleton } from "@/components/ui/skeleton"

export default function TenantsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-72 rounded-md" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
