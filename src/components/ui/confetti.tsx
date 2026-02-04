"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  duration: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

const colors = [
  "#ef4444", // red
  "#dc2626", // red-600
  "#991b1b", // red-800
  "#f87171", // red-400
  "#b91c1c", // red-700
  "#7f1d1d", // red-900
  "#fee2e2", // red-50
];

export function Confetti({ isActive, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        duration: 2.5 + Math.random(),
      }));
      
      // Use requestAnimationFrame to avoid setState during render/effect cycle if possible, 
      // or ensure it's handled after the current execution frame.
      const frame = requestAnimationFrame(() => {
        setPieces(newPieces);
        setShow(true);
      });

      // Hide after duration
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    }
  }, [isActive, duration]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-200 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                opacity: 1,
                x: `${piece.x}vw`,
                y: -20,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                opacity: [1, 1, 0],
                y: "100vh",
                rotate: piece.rotation + 720,
                scale: [1, 1, 0.5],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: "easeOut",
              }}
              className="absolute w-3 h-3"
              style={{ backgroundColor: piece.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook to trigger confetti
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = () => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 100);
  };

  return { isActive, trigger };
}
