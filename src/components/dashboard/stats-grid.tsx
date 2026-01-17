"use client";

import { Card, Skeleton } from "@/components/ui";
import { LucideIcon } from "lucide-react";

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string | number | React.ReactNode;
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: Math.max(0, 4) }).map((_, i) => (
        <Card key={i} className="p-4 border-transparent">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function DashboardStats({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 border-white/5 bg-white/2 backdrop-blur-sm hover:border-red-500/30 transition-all duration-500 group shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:scale-110 transition-all duration-500">
              <stat.icon className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">{stat.label}</p>
              <div className="text-lg font-bold text-white leading-tight truncate">{stat.value}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
