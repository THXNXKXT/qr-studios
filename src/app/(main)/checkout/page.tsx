"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  ArrowLeft,
  Check,
  Shield,
} from "lucide-react";
import { Button, Card, Input, Confetti, useConfetti } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"review" | "payment" | "success">("review");
  const { isActive: showConfetti, trigger: triggerConfetti } = useConfetti();

  const total = getTotal();

  if (items.length === 0 && step !== "success") {
    router.push("/cart");
    return null;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    // ในการใช้งานจริงจะเรียก API เพื่อสร้าง Stripe Checkout Session
    try {
      // const response = await fetch("/api/checkout", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ items }),
      // });
      // const { sessionId } = await response.json();
      // const stripe = await getStripe();
      // await stripe?.redirectToCheckout({ sessionId });

      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStep("success");
      clearCart();
      triggerConfetti();
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <Confetti isActive={showConfetti} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            ชำระเงินสำเร็จ!
          </h1>
          <p className="text-gray-400 mb-8">
            ขอบคุณสำหรับการสั่งซื้อ คุณจะได้รับ License Key ทางอีเมลภายใน 5 นาที
          </p>
          <div className="space-y-3">
            <Link href="/dashboard/licenses">
              <Button className="w-full">ดู License ของฉัน</Button>
            </Link>
            <Link href="/products">
              <Button variant="secondary" className="w-full">
                เลือกซื้อสินค้าเพิ่ม
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปตะกร้าสินค้า
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                สรุปคำสั่งซื้อ
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-4"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-linear-to-br from-red-900/50 to-black shrink-0">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-red-400">
                            {item.product.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        จำนวน: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-red-400">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>ราคาสินค้า</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-white text-lg font-semibold">
                  <span>รวมทั้งหมด</span>
                  <span className="text-red-400">{formatPrice(total)}</span>
                </div>
              </div>
            </Card>

            {/* Security Info */}
            <div className="mt-6 flex items-center gap-3 text-gray-400 text-sm">
              <Shield className="w-5 h-5 text-green-400" />
              <span>การชำระเงินปลอดภัยด้วย Stripe SSL Encryption</span>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-400" />
                ข้อมูลการชำระเงิน
              </h2>

              <div className="space-y-4">
                {/* Card Number */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    หมายเลขบัตร
                  </label>
                  <Input placeholder="1234 5678 9012 3456" />
                </div>

                {/* Expiry & CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      วันหมดอายุ
                    </label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      CVC
                    </label>
                    <Input placeholder="123" />
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    ชื่อบนบัตร
                  </label>
                  <Input placeholder="JOHN DOE" />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    อีเมล (สำหรับรับ License)
                  </label>
                  <Input type="email" placeholder="email@example.com" />
                </div>

                {/* Pay Button */}
                <Button
                  size="lg"
                  className="w-full mt-6"
                  onClick={handlePayment}
                  isLoading={isProcessing}
                >
                  <Lock className="w-4 h-4" />
                  ชำระเงิน {formatPrice(total)}
                </Button>

                {/* Note */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  เมื่อคลิก "ชำระเงิน" คุณยอมรับ{" "}
                  <Link href="/terms" className="text-red-400 hover:underline">
                    ข้อกำหนดการใช้งาน
                  </Link>{" "}
                  และ{" "}
                  <Link href="/refund-policy" className="text-red-400 hover:underline">
                    นโยบายการคืนเงิน
                  </Link>
                </p>
              </div>
            </Card>

            {/* Payment Methods */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="text-gray-500 text-sm">รองรับการชำระเงินผ่าน</span>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-white/5 rounded text-xs text-gray-400">
                  Visa
                </div>
                <div className="px-3 py-1 bg-white/5 rounded text-xs text-gray-400">
                  Mastercard
                </div>
                <div className="px-3 py-1 bg-white/5 rounded text-xs text-gray-400">
                  PromptPay
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
