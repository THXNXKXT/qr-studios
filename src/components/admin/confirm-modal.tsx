"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Ban, X, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "danger",
}: ConfirmModalProps) {
  const { t } = useTranslation("admin");
  const [isLoading, setIsLoading] = useState(false);

  // If text props are not provided, use translations from common namespace
  const finalConfirmText = confirmText || t("common.confirm");
  const finalCancelText = cancelText || t("common.cancel");

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const iconConfig = {
    danger: { icon: Trash2, bg: "bg-red-500/20", color: "text-red-400" },
    warning: { icon: AlertTriangle, bg: "bg-red-500/20", color: "text-red-400" },
    info: { icon: Ban, bg: "bg-red-500/20", color: "text-red-400" },
  };

  const config = iconConfig[type];
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/95 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md flex flex-col"
        >
          <Card className="flex flex-col overflow-hidden border-white/5 bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl relative p-8">
            <div className={cn(
              "absolute top-0 left-0 w-full h-1 bg-linear-to-r",
              type === "danger" ? "from-red-600 via-red-500 to-transparent" :
                type === "warning" ? "from-yellow-600 via-yellow-500 to-transparent" :
                  "from-blue-600 via-blue-500 to-transparent"
            )} />

            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon Container */}
              <div className={cn(
                "w-20 h-20 rounded-4xl flex items-center justify-center border transition-all duration-500",
                type === "danger" ? "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]" :
                  type === "warning" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]" :
                    "bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              )}>
                <Icon className="w-10 h-10" />
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h2>
                <div className="text-gray-500 text-sm font-medium leading-relaxed uppercase tracking-widest text-[10px] opacity-80">
                  {message}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col w-full gap-3 pt-4">
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={cn(
                    "w-full py-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg",
                    type === "danger" ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20" :
                      type === "warning" ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-600/20" :
                        "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("common.processing")}</span>
                    </div>
                  ) : (
                    finalConfirmText
                  )}
                </Button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full py-4 text-gray-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  {finalCancelText}
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
