"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  Shield,
  Loader2,
  ImageOff,
  AlertCircle,
  X,
  Star
} from "lucide-react";
import { Button, Card, PromoCodeInput, FlashSaleTimer, Badge } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { usePromoStore } from "@/store/promo";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import { cn, formatPrice, isProductOnFlashSale, getProductPrice, getTierInfo, calculateTierDiscount } from "@/lib/utils";
import { useTranslation, Trans } from "react-i18next";

export default function CartPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const { calculateDiscount, code: promoCode, appliedCode, setAppliedCode, removeCode } = usePromoStore();
  const [mounted, setMounted] = useState(false);
  const [expiredItems, setExpiredItems] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderTranslation = (key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  const subtotal = getTotal();
  const tier = getTierInfo(user?.totalSpent || 0);
  const tierDiscount = calculateTierDiscount(subtotal, user?.totalSpent || 0);

  const handleSaleExpire = useCallback((productId: string, productName: string) => {
    setExpiredItems(prev => {
      if (prev.includes(productName)) return prev;
      return [...prev, productName];
    });
  }, []);

  useEffect(() => {
    const validatePromo = async () => {
      const codeToValidate = promoCode?.trim().toUpperCase();
      if (!codeToValidate || subtotal === 0) return;
      
      try {
        const token = getAuthToken();
        const { promoApi } = await import("@/lib/api");
        const validTotal = Number(subtotal) || 0;
        console.log("[Cart] Auto-validating promo:", { code: codeToValidate, cartTotal: validTotal });
        
        const { data, error } = await promoApi.validate(codeToValidate, validTotal, token || undefined);
        
        if (data && (data as any).success) {
          const newData = (data as any).data;
          setAppliedCode(newData);
        } else {
          removeCode();
        }
      } catch (err) {
        console.error("Auto-validation error:", err);
        removeCode();
      }
    };

    validatePromo();
  }, [subtotal, promoCode, setAppliedCode, removeCode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const discount = useMemo(() => calculateDiscount(subtotal), [calculateDiscount, subtotal, appliedCode]);
  const total = useMemo(() => subtotal - discount - tierDiscount, [subtotal, discount, tierDiscount]);

  const expectedPoints = useMemo(() => {
    let points = 0;
    items.forEach(item => {
      if (item.product.rewardPoints && item.product.rewardPoints > 0) {
        points += item.product.rewardPoints * item.quantity;
      }
    });
    return points;
  }, [items]);

  const handleRemoveItem = useCallback((id: string) => {
    removeItem(id);
  }, [removeItem]);

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    updateQuantity(id, quantity);
  }, [updateQuantity]);

  const handleClearCart = useCallback(() => {
    clearCart();
  }, [clearCart]);

  const renderedItems = useMemo(() => items.map((item) => (
    <motion.div
      key={item.product.id}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="p-4 overflow-hidden group hover:border-red-500/30 transition-colors">
        <div className="flex gap-4">
          {/* Image */}
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/5 shrink-0">
            {item.product.images?.[0] ? (
              <Image
                src={item.product.images[0]}
                alt={item.product.name}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                <ImageOff className="w-8 h-8 text-gray-600 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">No Image</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product.id}`}
                  className="font-semibold text-white hover:text-red-400 transition-colors line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {isProductOnFlashSale(item.product) && (
                    <FlashSaleTimer 
                      endTime={item.product.flashSaleEnds!} 
                      variant="compact"
                      onExpire={() => handleSaleExpire(item.product.id, item.product.name)}
                    />
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveItem(item.product.id)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
              {item.product.description}
            </p>

            <div className="flex items-center justify-between mt-4">
              {/* Quantity */}
              <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
                <button
                  className="p-1 hover:text-red-400 disabled:opacity-50 transition-colors"
                  onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium text-white">
                  {item.quantity}
                </span>
                <button
                  className="p-1 hover:text-red-400 transition-colors"
                  onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Price & Points */}
              <div className="flex flex-col items-end gap-1.5">
                {item.product.rewardPoints !== undefined && item.product.rewardPoints > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 shadow-sm shadow-yellow-500/5">
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Star className="w-2 h-2 text-black fill-black" />
                    </div>
                    <span className="text-[10px] font-black text-yellow-500 tracking-tight flex items-center gap-1">
                      <span className="text-xs">+{(item.product.rewardPoints * item.quantity).toLocaleString()}</span> <span className="text-[8px] opacity-70 uppercase font-black">Points</span>
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-end">
                  <span className="font-bold text-red-400">
                    {formatPrice(getProductPrice(item.product) * item.quantity)}
                  </span>
                  {isProductOnFlashSale(item.product) && (
                    <span className="text-[10px] text-gray-500 line-through opacity-50 font-bold">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )), [items, handleRemoveItem, handleUpdateQuantity]);

  if (!mounted) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white mb-2">{renderTranslation("cart.empty_title")}</h1>
          <p className="text-gray-400 mb-6">{renderTranslation("cart.empty_desc")}</p>
          <Link href="/products">
            <Button>
              <ShoppingBag className="w-5 h-5" />
              {renderTranslation("cart.shop_now")}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">{renderTranslation("cart.title")}</h1>
          <p className="text-gray-400">
            {renderTranslation("cart.items_count", { count: items.length })}
          </p>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {expiredItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-4 relative">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-bold text-white mb-1">{renderTranslation("cart.notifications.price_changed_title")}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <Trans
                      i18nKey="cart.notifications.price_changed_desc"
                      values={{ names: expiredItems.join(", ") }}
                      components={[<span key="0" className="text-red-400 font-bold" />]}
                    />
                  </p>
                </div>
                <button 
                  onClick={() => setExpiredItems([])}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {renderedItems}
            </AnimatePresence>

            {/* Clear Cart */}
            <div className="flex justify-between items-center pt-4">
              <Link href="/products" className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" />
                {renderTranslation("cart.continue_shopping")}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleClearCart} className="text-gray-500 hover:text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                {renderTranslation("cart.clear_cart")}
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-white mb-6">{renderTranslation("cart.summary.title")}</h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">
                  {renderTranslation("cart.summary.promo_code")}
                </label>
                <PromoCodeInput cartTotal={subtotal} />
              </div>

              {/* Summary */}
              <div className="space-y-4 py-4 border-t border-white/10">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>{renderTranslation("cart.summary.subtotal")}</span>
                  <span className="font-medium text-white">{formatPrice(subtotal)}</span>
                </div>
                {tierDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-red-400 font-bold">
                      <span>{renderTranslation("cart.summary.tier_discount", { tier: tier.name })}</span>
                      <Badge variant="outline" className={cn("text-[10px] py-0 border-none font-black", tier.bg, tier.color)}>
                        {tier.icon} {tier.discount}%
                      </Badge>
                    </div>
                    <span className="text-red-400 font-bold">-{formatPrice(tierDiscount)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-red-400 font-bold">
                      <span>{renderTranslation("cart.summary.promo_discount", { code: promoCode })}</span>
                    </div>
                    <span className="text-red-400 font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-white pt-4 border-t border-white/10">
                  <span className="text-xl font-bold">{renderTranslation("cart.summary.total")}</span>
                  <span className="text-2xl font-black text-red-500">{formatPrice(total)}</span>
                </div>
                
                {/* Earned Points Preview */}
                <div className="relative group overflow-hidden py-3 px-4 rounded-2xl bg-linear-to-br from-yellow-500/20 to-orange-500/5 border border-yellow-500/20 mt-4">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Star className="w-12 h-12 text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                      <Star className="w-5 h-5 text-black fill-black" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-yellow-500/60 uppercase tracking-widest">Rewards Points</span>
                      <span className="text-sm font-black text-yellow-500">
                        <Trans
                          i18nKey="cart.summary.points_receive"
                          values={{ points: expectedPoints.toLocaleString() }}
                          components={[<span key="0" className="text-lg" />]}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link href="/checkout">
                <Button size="lg" className="w-full mt-4 group bg-red-600 hover:bg-red-500">
                  {renderTranslation("cart.summary.checkout")}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span>{renderTranslation("cart.summary.trust_instant")}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <CreditCard className="w-4 h-4 text-red-500" />
                  <span>{renderTranslation("cart.summary.trust_payment")}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
