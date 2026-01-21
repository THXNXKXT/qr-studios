"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-red-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-white/5 group-[.toast]:text-white",
          success: "group-[.toast]:border-green-500/50 group-[.toast]:bg-green-500/10",
          error: "group-[.toast]:border-red-500/50 group-[.toast]:bg-red-500/10",
          info: "group-[.toast]:border-blue-500/50 group-[.toast]:bg-blue-500/10",
          warning: "group-[.toast]:border-yellow-500/50 group-[.toast]:bg-yellow-500/10",
        },
      }}
    />
  );
}
