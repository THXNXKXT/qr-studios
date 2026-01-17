"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashSaleTimerProps {
  endTime: Date | string;
  onExpire?: () => void;
  className?: string;
  variant?: "default" | "compact" | "banner";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

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

  useEffect(() => {
    const calculateTimeLeft = () => {
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
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (isExpired) {
    return (
      <div className={cn("text-red-400 text-sm font-medium", className)}>
        โปรโมชั่นสิ้นสุดแล้ว
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
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

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Clock className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-white tabular-nums">
          {timeLeft.hours.toString().padStart(2, "0")}:
          {timeLeft.minutes.toString().padStart(2, "0")}:
          {timeLeft.seconds.toString().padStart(2, "0")}
        </span>
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
            <TimeBlock value={timeLeft.days} label="วัน" />
            <span className="text-2xl text-white/50">:</span>
            <TimeBlock value={timeLeft.hours} label="ชม." />
            <span className="text-2xl text-white/50">:</span>
            <TimeBlock value={timeLeft.minutes} label="นาที" />
            <span className="text-2xl text-white/50">:</span>
            <TimeBlock value={timeLeft.seconds} label="วินาที" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20">
        <Zap className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-red-400">Flash Sale</span>
      </div>
      <div className="flex items-center gap-1 text-white font-mono">
        <span className="bg-white/10 px-2 py-1 rounded">
          {timeLeft.hours.toString().padStart(2, "0")}
        </span>
        <span>:</span>
        <span className="bg-white/10 px-2 py-1 rounded">
          {timeLeft.minutes.toString().padStart(2, "0")}
        </span>
        <span>:</span>
        <span className="bg-white/10 px-2 py-1 rounded">
          {timeLeft.seconds.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
