"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  className,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, handleEscape]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop Layer - Fixed sibling for perfect viewport coverage */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-[-100vh] z-1000000 bg-black/80 backdrop-blur-xl pointer-events-auto"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Content & Scrolling Layer - Fixed sibling */}
          <div className="fixed inset-0 z-1000001 overflow-y-auto pointer-events-none flex items-center justify-center p-4">
            <div className="flex min-h-full w-full items-center justify-center py-12">
              {/* Modal Content Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "relative w-full max-w-lg rounded-3xl bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto flex flex-col my-auto",
                  className
                )}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/2 shrink-0">
                    {title && (
                      <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
                    )}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="ml-auto p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
