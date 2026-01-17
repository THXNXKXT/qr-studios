"use client";

import { Card, Skeleton } from "@/components/ui";

export function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[300px]">
      {Array.from({ length: Math.max(0, 4) }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
