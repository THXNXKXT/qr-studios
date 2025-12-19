"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  fullScreen?: boolean;
}

export function ErrorState({
  title = "เกิดข้อผิดพลาด",
  message = "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
  onRetry,
  showHomeButton = true,
  fullScreen = false,
}: ErrorStateProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <Card className="p-8 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="w-4 h-4" />
              ลองใหม่
            </Button>
          )}
          {showHomeButton && (
            <Link href="/">
              <Button variant="secondary">
                <Home className="w-4 h-4" />
                กลับหน้าแรก
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        {content}
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
}
