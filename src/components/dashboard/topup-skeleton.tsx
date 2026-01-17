"use client";

import { Card, Skeleton } from "@/components/ui";

export function TopupSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: Math.max(0, 6) }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </Card>

        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </Card>
      </div>
    </div>
  );
}
