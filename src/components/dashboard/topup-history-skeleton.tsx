"use client";

import { Card, Skeleton } from "@/components/ui";

export function TopupHistorySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Card className="overflow-hidden border-white/10 p-0">
        <div className="space-y-0">
          {Array.from({ length: Math.max(0, 6) }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-6 border-b border-white/5">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex-1 hidden md:block">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-5 w-20 ml-auto" />
                <Skeleton className="h-6 w-16 ml-auto rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
