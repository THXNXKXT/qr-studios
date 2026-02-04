"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("Modal components must be used within <Modal>");
  }
  return context;
}

// ==================== Root Component ====================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, children }: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Use queueMicrotask to avoid react-hooks/set-state-in-effect warning
  useEffect(() => {
    queueMicrotask(() => setIsMounted(true));
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isMounted) return null;

  return createPortal(
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="modal-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="contents"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>,
    document.body
  );
}

// ==================== Overlay ====================

interface OverlayProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function Overlay({ children, className, onClick }: OverlayProps) {
  const { onClose } = useModal();

  const handleClick = () => {
    if (onClick) onClick();
    else onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed inset-[-100vh] z-1000000 bg-black/80 backdrop-blur-xl",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </motion.div>
  );
}

// ==================== Content ====================

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

function Content({ children, className }: ContentProps) {
  return (
    <div className="fixed inset-0 z-1000001 overflow-y-auto flex items-center justify-center p-4 pointer-events-none">
      <div className="flex min-h-full w-full items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "relative w-full max-w-lg rounded-3xl bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto flex flex-col my-auto",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// ==================== Header ====================

interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
}

function Header({ children, className }: HeaderProps) {
  if (!children) return null;

  return (
    <div className={cn(
      "flex items-center justify-between p-5 border-b border-white/5 bg-white/2 shrink-0",
      className
    )}>
      {children}
    </div>
  );
}

// ==================== Title ====================

interface TitleProps {
  children: React.ReactNode;
  className?: string;
}

function Title({ children, className }: TitleProps) {
  return (
    <h2 className={cn("text-lg font-bold text-white tracking-tight", className)}>
      {children}
    </h2>
  );
}

// ==================== CloseButton ====================

interface CloseButtonProps {
  className?: string;
}

function CloseButton({ className }: CloseButtonProps) {
  const { onClose } = useModal();

  return (
    <button
      onClick={onClose}
      className={cn(
        "ml-auto p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-300",
        className
      )}
    >
      <X className="w-5 h-5" />
    </button>
  );
}

// ==================== Body ====================

interface BodyProps {
  children: React.ReactNode;
  className?: string;
}

function Body({ children, className }: BodyProps) {
  return (
    <div className={cn("p-0 flex-1 overflow-y-auto custom-scrollbar", className)}>
      {children}
    </div>
  );
}

// ==================== Attach sub-components ====================

Modal.Overlay = Overlay;
Modal.Content = Content;
Modal.Header = Header;
Modal.Title = Title;
Modal.CloseButton = CloseButton;
Modal.Body = Body;

export { Modal };
