"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashSaleTimerProps {
  endTime: Date | string;
  onExpire?: () => void;
  className?: string;
  variant?: "default" | "compact" | "banner" | "pill";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TimeBlock = ({ value, label, variant }: { value: number; label: string; variant?: string }) => (
  <div className="flex flex-col items-center">
    <motion.div
      key={value}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "font-bold tabular-nums",
        variant === "compact" ? "text-lg" : "text-2xl md:text-3xl",
        "text-white"
      )}
    >
      {value.toString().padStart(2, "0")}
    </motion.div>
    <span className="text-xs text-gray-400">{label}</span>
  </div>
);

export function FlashSaleTimer({
  endTime,
  onExpire,
  className,
  variant = "default",
}: FlashSaleTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const difference = end - now;

    if (difference <= 0) {
      setIsExpired(true);
      onExpire?.();
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [endTime, onExpire]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (isExpired) {
    return (
      <div className={cn("text-red-400 text-sm font-medium", className)}>
        โปรโมชั่นสิ้นสุดแล้ว
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-linear-to-r from-red-600 to-red-500 p-4 md:p-6",
          className
        )}
      >
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Flash Sale!</h3>
              <p className="text-white/80 text-sm">ลดสูงสุด 50%</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TimeBlock value={timeLeft.days} label="วัน" variant={variant} />
            <span className="text-2xl text-white/50">:</span>
            <TimeBlock value={timeLeft.hours} label="ชม." variant={variant} />
            <span className="text-2xl text-white/50">:</span>
            <TimeBlock value={timeLeft.minutes} label="นาที" variant={variant} />
            <span className="text-2xl text-white/50">:</span>
            <TimeBlock value={timeLeft.seconds} label="วินาที" variant={variant} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="flex items-center gap-1 bg-red-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg shadow-red-600/30">
          <Zap className="w-3 h-3 text-white fill-white" />
          <span className="text-xs font-bold text-white tabular-nums tracking-tight">
            {timeLeft.hours.toString().padStart(2, "0")}:
            {timeLeft.minutes.toString().padStart(2, "0")}:
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  }
}
