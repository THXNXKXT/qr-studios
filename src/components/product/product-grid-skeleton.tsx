"use client";

import { Card, Skeleton } from "@/components/ui";

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
      {Array.from({ length: Math.max(0, 8) }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-white/5 bg-white/2">
          <Skeleton className="aspect-video w-full rounded-none opacity-20" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4 opacity-20" />
            <Skeleton className="h-3 w-full opacity-10" />
            <Skeleton className="h-3 w-2/3 opacity-10" />
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <Skeleton className="h-5 w-20 opacity-20" />
              <div className="flex gap-1">
                <Skeleton className="h-4 w-4 rounded-full opacity-10" />
                <Skeleton className="h-4 w-4 rounded-full opacity-10" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
