"use client";

import { Card, Skeleton } from "@/components/ui";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex-1 space-y-4">
            {Array.from({ length: Math.max(0, 3) }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: Math.max(0, 4) }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
