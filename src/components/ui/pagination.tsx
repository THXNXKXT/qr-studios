"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="w-10 h-10 rounded-xl hover:bg-white/5 border border-white/5 disabled:opacity-30"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          <div key={index}>
            {page === "..." ? (
              <div className="w-10 h-10 flex items-center justify-center text-gray-500">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "ghost"}
                size="icon"
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "w-10 h-10 rounded-xl font-black text-xs transition-all duration-300",
                  currentPage === page
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/5"
                )}
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="w-10 h-10 rounded-xl hover:bg-white/5 border border-white/5 disabled:opacity-30"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
