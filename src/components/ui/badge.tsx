"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-md",
        secondary: "bg-white/10 text-gray-300 border border-white/20 backdrop-blur-md",
        success: "bg-green-500 text-white border-none shadow-[0_0_15px_rgba(34,197,94,0.4)]",
        warning: "bg-yellow-500 text-black border-none shadow-[0_0_15px_rgba(234,179,8,0.4)]",
        destructive: "bg-red-600 text-white border-none shadow-[0_0_15px_rgba(220,38,38,0.4)]",
        outline: "border border-white/20 text-gray-300 backdrop-blur-md",
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
