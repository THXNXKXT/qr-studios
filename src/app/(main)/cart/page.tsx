"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Wallet,
} from "lucide-react";
import { Button, Card, FlashSaleTimer, PromoCodeInput } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { usePromoStore } from "@/store/promo";
import { formatPrice } from "@/lib/utils";

// Flash sale ends in 24 hours from now
const flashSaleEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const { calculateDiscount } = usePromoStore();
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "balance">("stripe");

  const subtotal = getTotal();
  const discount = calculateDiscount(subtotal);
  const total = subtotal - discount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ตะกร้าว่างเปล่า</h1>
          <p className="text-gray-400 mb-6">ยังไม่มีสินค้าในตะกร้าของคุณ</p>
          <Link href="/products">
            <Button>
              <ShoppingBag className="w-5 h-5" />
              เลือกซื้อสินค้า
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Flash Sale Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <FlashSaleTimer endTime={flashSaleEndTime} variant="banner" />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">ตะกร้าสินค้า</h1>
          <p className="text-gray-400">
            คุณมี {items.length} รายการในตะกร้า
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-linear-to-br from-red-900/50 to-black shrink-0">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-red-400">
                              {item.product.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="font-semibold text-white hover:text-red-400 transition-colors line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                          {item.product.description}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center text-white">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Price & Remove */}
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-red-400">
                              {formatPrice(item.product.price * item.quantity)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-400"
                              onClick={() => removeItem(item.product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear Cart */}
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="w-4 h-4" />
                ล้างตะกร้า
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-white mb-6">สรุปคำสั่งซื้อ</h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">
                  โค้ดส่วนลด
                </label>
                <PromoCodeInput cartTotal={subtotal} />
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">
                  วิธีชำระเงิน
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentMethod("stripe")}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      paymentMethod === "stripe"
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-red-400" />
                    <span className="text-white">บัตรเครดิต/เดบิต (Stripe)</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("balance")}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      paymentMethod === "balance"
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-red-400" />
                    <span className="text-white">ยอดเงินในบัญชี</span>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3 py-4 border-t border-white/10">
                <div className="flex justify-between text-gray-400">
                  <span>ราคาสินค้า</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>ส่วนลด</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white text-lg font-semibold pt-3 border-t border-white/10">
                  <span>รวมทั้งหมด</span>
                  <span className="text-red-400">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link href="/checkout">
                <Button size="lg" className="w-full mt-4 group">
                  ดำเนินการชำระเงิน
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              {/* Security Note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                การชำระเงินปลอดภัยด้วย Stripe
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
