"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";

interface AdminPinModalProps {
  onSuccess: () => void;
}

export const AdminPinModal = ({ onSuccess }: AdminPinModalProps) => {
  const { t } = useTranslation("admin");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Fetch the correct PIN from settings
    const fetchPin = async () => {
      try {
        const { data: res } = await adminApi.getSettings() as any;
        if (res && res.success && res.data) {
          // The backend returns an object where keys are setting keys and values are setting values
          // e.g., { "ADMIN_PIN": "123456", "SITE_NAME": "QR Studio" }
          const pinValue = res.data["ADMIN_PIN"];
          if (pinValue !== undefined) {
            setStoredPin(String(pinValue));
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin pin setting:", err);
      }
    };
    fetchPin();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);

    // Move to next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinString = pin.join("");
    if (pinString.length !== 6) return;

    setLoading(true);
    setError(false);

    try {
      // Use the fetched PIN if available, otherwise fallback to default for safety
      const correctPin = storedPin || "123456";
      
      if (pinString === correctPin) {
        localStorage.setItem("admin_session_verified", "true");
        localStorage.setItem("admin_session_expiry", (Date.now() + 3600000).toString()); // 1 hour
        onSuccess();
      } else {
        setError(true);
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.every(digit => digit !== "")) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md p-8 text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-red-600/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-linear-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl shadow-red-600/40 border border-white/10">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
          {t("admin_pin.title", "Security Check")}
        </h2>
        <p className="text-gray-400 text-sm mb-10 font-medium">
          {t("admin_pin.subtitle", "Please enter your 6-digit administrator PIN to continue.")}
        </p>

        <div className="flex justify-center gap-3 mb-8">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className={cn(
                "w-12 h-16 text-2xl font-black text-center bg-white/5 border-2 rounded-2xl transition-all duration-300 outline-none",
                error 
                  ? "border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                  : "border-white/5 text-white focus:border-red-600 focus:bg-white/10 shadow-inner",
                loading && "opacity-50 cursor-not-allowed"
              )}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest mb-6"
            >
              <AlertCircle className="w-4 h-4" />
              {t("admin_pin.invalid_pin", "Invalid administrator PIN")}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
            <Lock className="w-3 h-3" />
            {loading ? t("admin_pin.verifying", "Verifying Session...") : t("admin_pin.secure_access", "Secure Admin Access")}
          </div>
          
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
