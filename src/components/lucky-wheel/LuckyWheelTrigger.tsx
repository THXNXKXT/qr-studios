"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { LuckyWheelModal } from "./LuckyWheelModal";
import { useAuth } from "@/hooks/useAuth";
import { luckyWheelApi } from "@/lib/api";

export function LuckyWheelTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const checkStatus = useCallback(async () => {
    try {
      const res = await luckyWheelApi.getStatus();
      // luckyWheelApi.getStatus() returns ApiResponse<{ enabled: boolean }>
      const response = res.data as { data?: { enabled: boolean }; success?: boolean };
      if (response?.success && typeof response.data?.enabled === 'boolean') {
        setIsEnabled(response.data.enabled);
      } else {
        setIsEnabled(true);
      }
    } catch (error) {
      console.error("Failed to check wheel status", error);
      setIsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Wrap in microtask to avoid react-hooks/set-state-in-effect warning
      Promise.resolve().then(() => checkStatus());
    }
  }, [isAuthenticated, checkStatus]);

  // Prevent flashing by waiting for both auth and status check
  if (!isAuthenticated || authLoading || isEnabled !== true) return null;

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="relative group w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40 border-2 border-white/20 overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-linear-to-tr from-yellow-400/20 to-transparent animate-pulse" />
          
          <Star className="w-7 h-7 text-white fill-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
          
          {/* Label */}
          <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-black/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Lucky Wheel!</span>
            </div>
          </div>
        </motion.button>
      </div>

      <LuckyWheelModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
