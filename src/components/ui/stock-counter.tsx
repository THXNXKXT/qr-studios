"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockCounterProps {
  stock: number;
  showIcon?: boolean;
  className?: string;
}

export function StockCounter({ stock, showIcon = true, className }: StockCounterProps) {
  const getStockStatus = () => {
    if (stock === -1) {
      return {
        label: "มีสินค้า",
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        icon: CheckCircle,
      };
    }
    if (stock === 0) {
      return {
        label: "สินค้าหมด",
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        icon: AlertTriangle,
      };
    }
    if (stock <= 5) {
      return {
        label: `เหลือ ${stock} ชิ้น`,
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        icon: AlertTriangle,
      };
    }
    if (stock <= 20) {
      return {
        label: `มีสินค้า ${stock} ชิ้น`,
        color: "text-red-300",
        bgColor: "bg-red-500/10",
        icon: Package,
      };
    }
    return {
      label: `มีสินค้า ${stock} ชิ้น`,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      icon: CheckCircle,
    };
  };

  const status = getStockStatus();
  const Icon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
        status.bgColor,
        status.color,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{status.label}</span>
      
      {/* Low stock pulse animation */}
      {stock > 0 && stock <= 5 && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
    </motion.div>
  );
}
