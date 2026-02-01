"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, History, Trophy, Loader2, Settings } from "lucide-react";
import { Card, Modal } from "@/components/ui";
import { luckyWheelApi } from "@/lib/api";
import type { LuckyWheelReward, LuckyWheelHistory } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import confetti from "canvas-confetti";
import { createLogger } from "@/lib/logger";

const luckyWheelLogger = createLogger("lucky-wheel");

export function LuckyWheelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, refresh } = useAuth();
  const [rewards, setRewards] = useState<LuckyWheelReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<LuckyWheelHistory[]>([]);
  const [activeTab, setActiveTab] = useState<"wheel" | "history">("wheel");
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<LuckyWheelReward | null>(null);

  const SPIN_COST = 100;

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Clear game state on open
      setWinner(null);
      setSpinning(false);
      // Note: We don't reset 'rotation' here. 
      // It will stay at its current value (initially 0).
    }
  }, [isOpen]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [rewardsRes, historyRes] = await Promise.all([
        luckyWheelApi.getRewards(),
        luckyWheelApi.getHistory()
      ]);

      if (rewardsRes.data && (rewardsRes.data as { success?: boolean }).success) {
        setRewards(((rewardsRes.data as { success?: boolean; data?: LuckyWheelReward[] }).data) || []);
      }
      if (historyRes.data && (historyRes.data as { success?: boolean }).success) {
        setHistory(((historyRes.data as { success?: boolean; data?: LuckyWheelHistory[] }).data) || []);
      }
    } catch (error) {
      luckyWheelLogger.error('Failed to load wheel data', { error });
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (spinning || !user || user.points < SPIN_COST) return;

    setSpinning(true);
    setWinner(null);

    try {
      const { data, error } = await luckyWheelApi.spin();

      if (error) {
        alert(error);
        setSpinning(false);
        return;
      }

      const spinData = data as unknown as { reward?: LuckyWheelReward; message?: string } | null;
      const reward = spinData?.reward;
      if (!reward) {
        luckyWheelLogger.error('Reward data missing in spin response', { data });
        setSpinning(false);
        return;
      }

      const rewardIndex = rewards.findIndex(r => r.id === reward.id);

      // Calculate rotation
      // Each segment is 360 / rewards.length
      const segmentAngle = 360 / rewards.length;

      // We want the middle of the selected segment to be at the top (0 degrees)
      const targetMidAngle = (rewardIndex * segmentAngle) + (segmentAngle / 2);
      const rotateToTarget = (360 - targetMidAngle) % 360;

      // Number of full rotations (unused variable for future use)
      const _extraSpins = 360 * 10;

      setRotation(prev => {
        // Calculate the next rotation value that lands on the target
        // We ensure it always spins forward by finding the next multiple of 360
        // then adding the target offset.
        const currentFullSpins = Math.floor(prev / 360);
        const nextTarget = (currentFullSpins + 10) * 360 + rotateToTarget;
        return nextTarget;
      });

      setTimeout(() => {
        setSpinning(false);
        setWinner(reward);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [reward.color, '#FFFFFF', '#FFD700']
        });
        refresh(); // Update user points/balance
        loadData(true); // Silent refresh history to avoid flickering
      }, 5000);

    } catch (error) {
      luckyWheelLogger.error('Spin error', { error });
      setSpinning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lucky Wheel - วงล้อเสี่ยงโชค" className="max-w-2xl">
      <div className="flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("wheel")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              activeTab === "wheel" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>หมุนวงล้อ</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              activeTab === "history" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติ</span>
          </button>
        </div>

        <div className="relative min-h-[400px]">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/60 backdrop-blur-[2px] rounded-2xl">
              <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
          )}

          {/* Disabled State */}
          {!loading && rewards.length === 0 && activeTab === "wheel" && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                <Settings className="w-10 h-10 text-red-500 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">ระบบปิดปรับปรุง</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                ขณะนี้ระบบวงล้อเสี่ยงโชคกำลังอยู่ระหว่างการปรับปรุง หรือปิดการใช้งานชั่วคราวโดยผู้ดูแลระบบ
              </p>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {/* Wheel Tab Content */}
            <div className={`relative ${activeTab === "wheel" ? "block" : "hidden"}`}>
              <div className="flex flex-col items-center gap-8 py-4">
                {/* User Stats */}
                <div className="flex gap-4">
                  <div className="bg-yellow-400/10 border border-yellow-400/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-yellow-500/60 uppercase font-black">Your Points</span>
                      <span className="text-lg font-black text-yellow-500">{user?.points?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <Star className="w-5 h-5 text-red-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-red-500/60 uppercase font-black">Spin Cost</span>
                      <span className="text-lg font-black text-red-500">{SPIN_COST} Pts</span>
                    </div>
                  </div>
                </div>

                {/* The Wheel Container (New Blue Style) */}
                <div className="relative group flex flex-col items-center">
                  {/* Blue Outer Frame */}
                  <div className="relative p-4 rounded-full bg-blue-700 border-12 border-blue-800 shadow-[0_15px_40px_rgba(0,0,0,0.4)] z-10">
                    {/* Decorative Lights (Small Dots) */}
                    {rewards.length > 0 && [...Array(Math.max(0, 16))].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-2 h-2 rounded-full border border-black/10 shadow-sm`}
                        style={{
                          backgroundColor: i % 2 === 0 ? '#ef4444' : '#fbbf24',
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) rotate(${i * 22.5}deg) translateY(-158px)`
                        }}
                      />
                    ))}

                    {/* Top Pointer (Sharp Carnival Style) */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                      <div className="relative flex flex-col items-center">
                        {/* Top Round Body */}
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-white relative z-10">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        </div>
                        {/* Sharp Needle Tip */}
                        <div 
                          className="w-0 h-0 border-l-14 border-l-transparent border-r-14 border-r-transparent border-t-32 border-t-red-600 mt-[-10px] relative z-0"
                          style={{ filter: 'drop-shadow(0 6px 4px rgba(0,0,0,0.2))' }}
                        />
                      </div>
                    </div>

                    {/* Wheel Surface */}
                    <div className="relative">
                      <motion.div
                        initial={{ rotate: rotation }}
                        animate={{ rotate: rotation }}
                        transition={spinning ? { duration: 5, ease: [0.15, 0, 0.15, 1] } : { duration: 0 }}
                        className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-12 border-blue-800 relative overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.3)] bg-white"
                        style={{
                          background: rewards.length > 0 
            ? `conic-gradient(from 0deg, ${rewards.map((r, i) => 
                `${r.color} ${i * (360 / Math.max(1, rewards.length))}deg ${(i + 1) * (360 / Math.max(1, rewards.length))}deg`
              ).join(', ')})`
            : '#1a1a1a'
                        }}
                      >
                        {/* High-Contrast Segment Dividers */}
                        {rewards.map((_, i) => {
                          const segmentCount = Math.max(1, rewards.length);
                          return (
                            <div
                              key={`divider-${i}`}
                              className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-white/20 origin-bottom"
                              style={{ transform: `translateX(-50%) rotate(${i * (360 / segmentCount)}deg)` }}
                            />
                          );
                        })}
                        
                        {/* Reward Labels (Positioned closer to the rim to avoid hub overlap) */}
                        {rewards.map((reward, i) => {
                          const angle = (360 / Math.max(1, rewards.length));
                          const rotate = i * angle + angle / 2;
                          return (
                            <div
                              key={reward.id}
                              className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom flex flex-col items-center justify-start pt-4"
                              style={{ transform: `translateX(-50%) rotate(${rotate}deg)` }}
                            >
                              <span 
                                className="text-[11px] sm:text-[12px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-center leading-none max-w-[85px] uppercase tracking-tighter"
                                style={{ 
                                  writingMode: 'vertical-rl',
                                  textOrientation: 'mixed',
                                  transform: 'rotate(180deg)',
                                  textShadow: '2px 2px 0px rgba(0,0,0,0.6)'
                                }}
                              >
                                {reward.name}
                              </span>
                            </div>
                          );
                        })}
                      </motion.div>
                    </div>

                    {/* Center Star Hub (SPIN Button - Reduced size to avoid overlap) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                      <button
                        onClick={handleSpin}
                        disabled={spinning || !user || user.points < SPIN_COST || rewards.length === 0}
                        className={`relative w-20 h-20 flex items-center justify-center transition-all duration-300 ${
                          spinning ? 'scale-90 brightness-75' : 'hover:scale-110 active:scale-95'
                        }`}
                      >
                        {/* Pulsing Aura */}
                        {!spinning && <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl animate-pulse" />}
                        
                        {/* Hub Body */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-blue-600 rounded-full border-4 border-blue-400 shadow-[0_0_40px_rgba(37,99,235,0.7)] flex items-center justify-center relative overflow-hidden">
                            {/* Hub Shine */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />
                            <Star className={`w-8 h-8 text-white fill-white transition-all duration-1000 ${spinning ? 'rotate-1440 scale-75 opacity-40' : 'drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]'}`} />
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Blue Base Stand */}
                  <div className="mt-[-20px] w-40 h-12 bg-blue-800 rounded-t-full shadow-lg z-0 relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-4 bg-blue-900 rounded-full" />
                  </div>
                </div>

                {/* Result Message */}
                <AnimatePresence>
                  {winner && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-4 w-full"
                    >
                      <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <Trophy className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-green-500 uppercase">ยินดีด้วย! คุณได้รับ</h4>
                        <p className="text-lg font-bold text-white">
                          {winner.name} ({winner.type === 'BALANCE' ? formatPrice(winner.value) : winner.value + ' Points'})
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* History Tab Content */}
            <div className={`relative ${activeTab === "history" ? "block" : "hidden"}`}>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length > 0 ? (
                  history.map((item) => (
                    <Card key={item.id} className="p-3 flex items-center justify-between bg-white/5 border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <Star className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{item.reward.name}</p>
                          <p className="text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleString('th-TH')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${item.reward.type === 'POINTS' ? 'text-yellow-500' : 'text-green-500'}`}>
                          +{item.reward.type === 'BALANCE' ? formatPrice(item.reward.value) : item.reward.value.toLocaleString() + ' Pts'}
                        </p>
                        <p className="text-[10px] text-gray-600 italic">Cost: {item.cost} Pts</p>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">ยังไม่มีประวัติการสุ่ม</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
