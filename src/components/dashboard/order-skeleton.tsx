"use client";

import { Card, Skeleton } from "@/components/ui";

export function OrderSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-8 w-24 ml-auto" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      </div>
      <div className="space-y-2 mb-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </Card>
  );
}
