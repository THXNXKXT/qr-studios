"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, MessageCircle, User, Check, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Card, Badge, ReviewStars, ReviewSummary } from "@/components/ui";
import { createLogger } from "@/lib/logger";

const reviewLogger = createLogger("product:review");

interface Review {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  helpful: number;
  createdAt: Date;
}

interface ReviewSectionProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  distribution: { [key: number]: number };
  canReview?: boolean;
  onSubmitReview?: (rating: number, comment: string) => Promise<void>;
}

export function ReviewSection({
  productId,
  reviews,
  averageRating,
  totalReviews,
  distribution,
  canReview = false,
  onSubmitReview,
}: ReviewSectionProps) {
  const { t, i18n } = useTranslation("home");
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (rating === 0 || !comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitReview?.(rating, comment);
      setShowForm(false);
      setRating(0);
      setComment("");
    } catch (error) {
      reviewLogger.error('Failed to submit review', { error });
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment, onSubmitReview]);

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{t("products.reviews.title")}</h2>
        {canReview && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <MessageCircle className="w-4 h-4" />
            {t("products.reviews.write_review")}
          </Button>
        )}
        {!canReview && !showForm && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-500 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t("products.reviews.review_hint")}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary */}
        <Card className="p-6">
          <ReviewSummary
            averageRating={averageRating}
            totalReviews={totalReviews}
            distribution={distribution}
          />
        </Card>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Review Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="p-6 mb-4 border-red-500/30">
                  <h3 className="font-semibold text-white mb-4">{t("products.reviews.form_title")}</h3>
                  
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">{t("products.reviews.rating_label")}</label>
                    <ReviewStars
                      rating={rating}
                      size="lg"
                      interactive
                      onChange={setRating}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">{t("products.reviews.comment_label")}</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t("products.reviews.comment_placeholder")}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || rating === 0 || !comment.trim()}
                    >
                      {isSubmitting ? t("products.reviews.submitting") : t("products.reviews.submit")}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowForm(false)}>
                      {t("products.reviews.cancel")}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reviews */}
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      {review.avatar ? (
                        <img
                          src={review.avatar}
                          alt={review.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-red-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{review.username}</span>
                        {review.isVerified && (
                          <Badge variant="success" className="text-xs">
                            <Check className="w-3 h-3" />
                            {t("products.reviews.verified_purchase")}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <ReviewStars rating={review.rating || 0} size="sm" />
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString(i18n.language === "th" ? "th-TH" : "en-US")}
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm">{review.comment}</p>

                      <div className="flex items-center gap-4 mt-4">
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          {t("products.reviews.helpful")} ({review.helpful})
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t("products.reviews.no_reviews")}</p>
              {canReview && (
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  {t("products.reviews.be_first")}
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
