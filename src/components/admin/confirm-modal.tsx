"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Ban, X, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
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
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  type = "danger",
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

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
    warning: { icon: AlertTriangle, bg: "bg-yellow-500/20", color: "text-yellow-400" },
    info: { icon: Ban, bg: "bg-blue-500/20", color: "text-blue-400" },
  };

  const config = iconConfig[type];
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md"
        >
          <Card className="p-6 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${config.bg} flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${config.color}`} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <p className="text-gray-400 mb-6">{message}</p>

            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                {cancelText}
              </Button>
              <Button
                variant={type === "danger" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
