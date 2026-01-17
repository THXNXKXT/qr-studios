"use client";

import { Card, Skeleton } from "@/components/ui";

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: Math.max(0, 3) }).map((_, i) => (
          <Card key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-6 space-y-6">
          {Array.from({ length: Math.max(0, 2) }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
        <div className="p-6 bg-white/5 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="pt-4 border-t border-white/5 flex justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </Card>
    </div>
  );
}
