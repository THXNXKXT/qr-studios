"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  Check, 
  CheckCircle2,
  Shield, 
  Wallet, 
  Loader2,
  AlertCircle,
  ShoppingBag,
  ImageOff,
  X,
  Clock,
  Star
} from "lucide-react";
import { Button, Card, Confetti, useConfetti, Badge, FlashSaleTimer } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { useCartStore } from "@/store/cart";
import { usePromoStore } from "@/store/promo";
import { cn, formatPrice, isProductOnFlashSale, getProductPrice, getTierInfo, calculateTierDiscount } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import { checkoutApi, ordersApi } from "@/lib/api";
import { useTranslation, Trans } from "react-i18next";

export default function CheckoutPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced, refresh } = useAuth();
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { code: promoCode, calculateDiscount, appliedCode } = usePromoStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [step, setStep] = useState<"review" | "payment" | "success">("review");
  const { isActive: showConfetti, trigger: triggerConfetti } = useConfetti();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiredItems, setExpiredItems] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderTranslation = (key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  const handleSaleExpire = useCallback((productName: string) => {
    setExpiredItems(prev => {
      if (prev.includes(productName)) return prev;
      return [...prev, productName];
    });
  }, []);

  const subtotal = useMemo(() => getTotal(), [getTotal]);
  const tier = getTierInfo(user?.totalSpent || 0);
  const tierDiscount = calculateTierDiscount(subtotal, user?.totalSpent || 0);
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

  const handlePayment = useCallback(async (paymentMethod: 'STRIPE' | 'BALANCE') => {
    if (items.length === 0) return;
    
    if (paymentMethod === 'BALANCE' && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    setIsProcessing(true);
    setShowConfirmDialog(false);
    setError(null);
    try {
      // Create a clean payload and log it
      const orderItems = items.map(item => {
        // Find the ID correctly, prioritizing direct id then product.id
        const productId = (item as any).id || (item as any).productId || item.product?.id || (item.product as any).id;
        return {
          productId: productId,
          quantity: item.quantity
        };
      });

      console.log("[Checkout] Processing order items payload:", JSON.stringify(orderItems, null, 2));

      // Verify no undefined or null IDs
      const invalidItems = orderItems.filter(i => !i.productId || i.productId === 'undefined' || typeof i.productId !== 'string');
      if (invalidItems.length > 0) {
        console.error("[Checkout] Invalid items found:", invalidItems);
        throw new Error(renderTranslation("checkout.errors.invalid_items"));
      }

      if (paymentMethod === 'STRIPE') {
        const { data, error: apiError } = await checkoutApi.createStripeSession(orderItems, promoCode || undefined);
        
        if (data && (data as any).success && (data as any).data?.url) {
          window.location.href = (data as any).data.url;
        } else {
          const errorMessage = apiError || (data as any)?.message || (data as any)?.error || renderTranslation("checkout.errors.session_failed");
          throw new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : String(errorMessage));
        }
      } else {
        if (user && user.balance < total) {
          throw new Error(renderTranslation("checkout.errors.insufficient_balance"));
        }

        console.log("[Checkout] Creating order for Balance payment:", { orderItems, promoCode });

        const { data: orderData, error: orderError } = await ordersApi.create(orderItems, 'BALANCE', promoCode || undefined);
        
        console.log("[Checkout] Order response:", { orderData, orderError });

        if (orderData && (orderData as any).success) {
          const orderId = (orderData as any).data.id;
          console.log("[Checkout] Order created, paying with balance:", orderId);
          const { data: payData, error: payError } = await checkoutApi.payWithBalance(orderId);
          
          console.log("[Checkout] Payment response:", { payData, payError });

          if (payData && (payData as any).success) {
            await new Promise(resolve => setTimeout(resolve, 500));
            await refresh();
            
            setStep("success");
            clearCart();
            triggerConfetti();
          } else {
            const payErrorMessage = payError || (payData as any)?.message || (payData as any)?.error || renderTranslation("checkout.errors.balance_failed");
            throw new Error(typeof payErrorMessage === 'object' ? JSON.stringify(payErrorMessage) : String(payErrorMessage));
          }
        } else {
          const orderErrorMessage = orderError || (orderData as any)?.message || (orderData as any)?.error || renderTranslation("checkout.errors.order_failed");
          const errorStr = typeof orderErrorMessage === 'object' ? JSON.stringify(orderErrorMessage) : String(orderErrorMessage);
          
          if (errorStr.includes('Some products not found')) {
            setError(renderTranslation("checkout.errors.products_not_found"));
            setTimeout(() => {
              clearCart();
              window.location.reload();
            }, 3000);
          } else {
            throw new Error(errorStr);
          }
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : renderTranslation("checkout.errors.general"));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsProcessing(false);
    }
  }, [items, showConfirmDialog, user, total, promoCode, refresh, clearCart, triggerConfetti]);

  const isAuthInitializing = !isSynced && !user && !!getAuthToken();
  const isLoading = (authLoading || isAuthInitializing || !mounted) && !user;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user && !authLoading && isSynced && !getAuthToken()) {
    if (typeof window !== 'undefined') {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    return null;
  }

  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{renderTranslation("checkout.errors.products_not_found")}</h1>
          <Link href="/products">
            <Button>{renderTranslation("products.detail.errors.back_to_products")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-start justify-center px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-black" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[160px] opacity-50" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>

        <Confetti isActive={showConfetti} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full relative z-10"
        >
          <Card className="p-8 md:p-10 text-center border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
            
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner relative">
              <Check className="w-10 h-10 text-red-500" />
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20" />
            </div>
            
            <h1 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">{renderTranslation("checkout.success.title")}</h1>
            <p className="text-gray-400 mb-8 leading-relaxed text-xs">
              {renderTranslation("checkout.success.desc")}
            </p>

            <div className="bg-white/2 rounded-2xl p-6 mb-8 border border-white/5 text-left relative group overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">{renderTranslation("checkout.success.payment_status")}</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold py-0.5 text-[10px]">{renderTranslation("checkout.success.status_success")}</Badge>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-gray-400 text-xs">{renderTranslation("checkout.success.remaining_balance")}</span>
                  <div className="text-right">
                    <p className="text-xl font-black text-red-500 tracking-tighter">
                      ฿{(user?.balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard/licenses" className="block">
                <Button size="xl" className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-xl shadow-red-600/40 transition-all active:scale-95 group text-sm">
                  {renderTranslation("checkout.success.view_my_licenses")}
                </Button>
              </Link>
              <Link href="/products" className="block">
                <Button size="xl" className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black rounded-xl transition-all active:scale-95 group text-sm">
                  {renderTranslation("checkout.success.shop_more")}
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {renderTranslation("checkout.back_to_cart")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl w-full mx-auto"
        >
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

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-7"
            >
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6">{renderTranslation("checkout.order_summary")}</h2>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                        {item.product.images?.[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                            <ImageOff className="w-6 h-6 text-gray-600 mb-0.5" />
                            <span className="text-[6px] font-black uppercase tracking-widest text-gray-600">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{item.product.name}</p>
                        <p className="text-sm text-gray-400">{renderTranslation("checkout.quantity")}: {item.quantity}</p>
                        {isProductOnFlashSale(item.product) && (
                          <div className="mt-1">
                            <FlashSaleTimer 
                              endTime={item.product.flashSaleEnds!} 
                              variant="compact"
                              onExpire={() => handleSaleExpire(item.product.name)}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="font-medium text-red-400">
                          {formatPrice(getProductPrice(item.product) * item.quantity)}
                        </p>
                        {isProductOnFlashSale(item.product) && (
                          <span className="text-[10px] text-gray-500 line-through opacity-50 font-bold">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>{renderTranslation("cart.summary.subtotal")}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {tierDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm font-bold">
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
                    <div className="flex justify-between items-center text-sm font-bold">
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <span>{renderTranslation("cart.summary.promo_discount", { code: promoCode })}</span>
                      </div>
                      <span className="text-red-400 font-bold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-white pt-4 border-t border-white/10">
                    <span className="text-xl font-bold">{renderTranslation("checkout.total_payment")}</span>
                    <span className="text-2xl font-black text-red-500">{formatPrice(total)}</span>
                  </div>

                  {/* Earned Points Preview */}
                  <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-yellow-400/5 border border-yellow-400/10 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400/20" />
                    <span className="text-xs font-bold text-yellow-500/80">
                      {renderTranslation("checkout.points_receive", { points: expectedPoints.toLocaleString() })}
                    </span>
                  </div>
                </div>
              </Card>

              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-400" />
                <p className="text-sm text-gray-300">{renderTranslation("checkout.secure_payment_msg")}</p>
              </div>
            </motion.div>

            {/* Payment Options */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5"
            >
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6">{renderTranslation("checkout.payment_method_title")}</h2>
                
                <div className="space-y-4">
                  <Button
                    size="xl"
                    onClick={() => handlePayment('BALANCE')}
                    disabled={!!(isProcessing || (user && user.balance < total))}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-16"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-6 h-6" />
                          {renderTranslation("checkout.pay_with_balance")}
                        </div>
                        <span 
                          className="text-xs text-white/80 font-bold mt-1"
                        >
                          {renderTranslation("checkout.balance_label")}: {formatPrice(user?.balance || 0)}
                        </span>
                      </div>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="xl"
                    onClick={() => handlePayment('STRIPE')}
                    disabled={isProcessing}
                    className="w-full h-16 border-white/10 hover:bg-white/5"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-6 h-6" />
                        {renderTranslation("checkout.pay_with_stripe")}
                      </div>
                    )}
                  </Button>

                  {(user && user.balance < total) && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <p className="text-xs text-red-400">{renderTranslation("checkout.insufficient_balance")}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Lock className="w-3 h-3" />
                  <span>Secure payment processing by Stripe</span>
                </div>
              </Card>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-gray-500">
                <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-semibold tracking-wider">VISA</span>
                </div>
                <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <div className="absolute w-3 h-3 rounded-full bg-gray-500 left-0"></div>
                    <div className="absolute w-3 h-3 rounded-full bg-gray-400 right-0 opacity-80"></div>
                  </div>
                  <span className="text-sm font-semibold tracking-wider">MasterCard</span>
                </div>
                <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="w-5 h-5 border-2 border-gray-500 rounded flex items-center justify-center font-bold text-[8px]">PP</div>
                  <span className="text-sm font-semibold tracking-wider">PromptPay</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title={renderTranslation("checkout.confirm_dialog.title")}
        className="max-w-md border-white/5 bg-black/60 backdrop-blur-3xl"
      >
        <div className="space-y-8 py-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner relative group">
              <Wallet className="w-10 h-10 text-red-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
              <div className="absolute inset-0 rounded-3xl border-2 border-red-500 animate-ping opacity-20" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{renderTranslation("checkout.confirm_dialog.title")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">
                {renderTranslation("checkout.confirm_dialog.desc")}
              </p>
            </div>
          </div>

          <div className="bg-white/2 rounded-2xl p-6 space-y-4 border border-white/5 relative group overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{renderTranslation("checkout.confirm_dialog.current_balance")}</span>
                <span className="text-white font-bold">{formatPrice(user?.balance || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{renderTranslation("checkout.confirm_dialog.amount_to_pay")}</span>
                <span className="text-red-500 font-black">-{formatPrice(total)}</span>
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-gray-400 text-xs font-bold">{renderTranslation("checkout.confirm_dialog.remaining_after")}</span>
                <span className="text-lg font-black text-red-500 tracking-tighter">
                  {formatPrice((user?.balance || 0) - total)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="xl"
              onClick={() => handlePayment('BALANCE')}
              disabled={isProcessing}
              className="w-full h-14 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-600/40 transition-all active:scale-95 group"
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                renderTranslation("checkout.confirm_dialog.confirm_btn")
              )}
            </Button>
            <Button
              variant="secondary"
              size="xl"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
              className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black rounded-2xl transition-all active:scale-95"
            >
              {renderTranslation("checkout.confirm_dialog.cancel_btn")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
