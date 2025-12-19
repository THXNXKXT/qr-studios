"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Wallet,
  CreditCard,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { Card, Button, Badge, Input } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

const topupPackages = [
  { amount: 100, bonus: 0 },
  { amount: 300, bonus: 15 },
  { amount: 500, bonus: 30 },
  { amount: 1000, bonus: 80 },
  { amount: 2000, bonus: 200 },
  { amount: 5000, bonus: 600 },
];

const paymentMethods = [
  { id: "stripe", name: "บัตรเครดิต/เดบิต", icon: CreditCard },
  { id: "promptpay", name: "PromptPay", icon: Wallet },
];

export default function TopupPage() {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);

  const currentBalance = 2500;

  const handleTopup = async () => {
    setIsProcessing(true);
    // Simulate payment
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    alert("เติมเงินสำเร็จ! (Demo)");
  };

  const getSelectedAmount = () => {
    if (selectedPackage !== null) {
      return topupPackages[selectedPackage].amount;
    }
    return parseInt(customAmount) || 0;
  };

  const getBonus = () => {
    if (selectedPackage !== null) {
      return topupPackages[selectedPackage].bonus;
    }
    // Custom amount bonus calculation
    const amount = parseInt(customAmount) || 0;
    if (amount >= 5000) return Math.floor(amount * 0.12);
    if (amount >= 2000) return Math.floor(amount * 0.1);
    if (amount >= 1000) return Math.floor(amount * 0.08);
    if (amount >= 500) return Math.floor(amount * 0.06);
    if (amount >= 300) return Math.floor(amount * 0.05);
    return 0;
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้า Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">เติมเงิน</h1>
          <p className="text-gray-400">เติมเงินเข้าบัญชีเพื่อซื้อสินค้า</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Packages */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Current Balance */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Wallet className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">ยอดเงินปัจจุบัน</p>
                    <p className="text-3xl font-bold text-white">
                      ฿{currentBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Packages */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                เลือกแพ็คเกจเติมเงิน
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {topupPackages.map((pkg, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedPackage(index);
                      setCustomAmount("");
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selectedPackage === index
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {pkg.bonus > 0 && (
                      <div className="absolute -top-2 -right-2">
                        <Badge variant="success" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          +{pkg.bonus}
                        </Badge>
                      </div>
                    )}
                    <p className="text-2xl font-bold text-white">
                      ฿{pkg.amount.toLocaleString()}
                    </p>
                    {pkg.bonus > 0 && (
                      <p className="text-sm text-green-400">
                        รับเพิ่ม ฿{pkg.bonus}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mt-6">
                <label className="text-sm text-gray-400 mb-2 block">
                  หรือระบุจำนวนเอง (ขั้นต่ำ ฿100)
                </label>
                <Input
                  type="number"
                  placeholder="ระบุจำนวนเงิน"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedPackage(null);
                  }}
                  min={100}
                />
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                วิธีชำระเงิน
              </h3>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      paymentMethod === method.id
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <method.icon className="w-5 h-5 text-red-400" />
                    <span className="text-white">{method.name}</span>
                    {paymentMethod === method.id && (
                      <Check className="w-5 h-5 text-red-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Right - Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">
                สรุปการเติมเงิน
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>จำนวนเงิน</span>
                  <span>{formatPrice(getSelectedAmount())}</span>
                </div>
                {getBonus() > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>โบนัส</span>
                    <span>+{formatPrice(getBonus())}</span>
                  </div>
                )}
                <div className="flex justify-between text-white text-lg font-semibold pt-3 border-t border-white/10">
                  <span>รวมได้รับ</span>
                  <span className="text-red-400">
                    {formatPrice(getSelectedAmount() + getBonus())}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleTopup}
                isLoading={isProcessing}
                disabled={getSelectedAmount() < 100}
              >
                <CreditCard className="w-4 h-4" />
                ชำระเงิน {formatPrice(getSelectedAmount())}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                การชำระเงินปลอดภัยด้วย Stripe SSL Encryption
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
