"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, MessageCircle, User, Check } from "lucide-react";
import { Button, Card, Badge, ReviewStars, ReviewSummary } from "@/components/ui";

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
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitReview?.(rating, comment);
      setShowForm(false);
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">รีวิวจากผู้ใช้</h2>
        {canReview && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <MessageCircle className="w-4 h-4" />
            เขียนรีวิว
          </Button>
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
                  <h3 className="font-semibold text-white mb-4">เขียนรีวิวของคุณ</h3>
                  
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">คะแนน</label>
                    <ReviewStars
                      rating={rating}
                      size="lg"
                      interactive
                      onChange={setRating}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">ความคิดเห็น</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="แชร์ประสบการณ์การใช้งานของคุณ..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || rating === 0 || !comment.trim()}
                    >
                      {isSubmitting ? "กำลังส่ง..." : "ส่งรีวิว"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowForm(false)}>
                      ยกเลิก
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
                            ซื้อจริง
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <ReviewStars rating={review.rating} size="sm" />
                        <span className="text-xs text-gray-500">
                          {review.createdAt.toLocaleDateString("th-TH")}
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm">{review.comment}</p>

                      <div className="flex items-center gap-4 mt-4">
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          เป็นประโยชน์ ({review.helpful})
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
              <p className="text-gray-400">ยังไม่มีรีวิว</p>
              {canReview && (
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  เป็นคนแรกที่รีวิว
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
