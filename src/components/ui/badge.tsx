"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-red-500/20 text-red-300 border border-red-500/30",
        secondary: "bg-white/10 text-gray-300 border border-white/20",
        success: "bg-red-500/20 text-red-300 border border-red-500/30",
        warning: "bg-red-500/10 text-red-400 border border-red-500/20",
        destructive: "bg-red-500/20 text-red-300 border border-red-500/30",
        outline: "border border-white/20 text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
