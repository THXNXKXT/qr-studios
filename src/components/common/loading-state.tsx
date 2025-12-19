"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = "กำลังโหลด...", fullScreen = false }: LoadingStateProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-red-500/20" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="py-12 flex items-center justify-center">
      {content}
    </div>
  );
}

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function LoadingButton({ isLoading, children, loadingText = "กำลังดำเนินการ..." }: LoadingButtonProps) {
  if (isLoading) {
    return (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        {loadingText}
      </>
    );
  }
  return <>{children}</>;
}
