import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Welcome card */}
          <div className="rounded-lg border p-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Activity rings skeleton */}
          <div className="rounded-lg border p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex justify-center gap-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
