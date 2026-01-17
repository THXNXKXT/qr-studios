"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  Star,
  User,
  Package,
  Calendar,
  Loader2,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { ConfirmModal } from "@/components/admin";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";

type Review = {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  productId: string;
  product: {
    id: string;
    name: string;
  };
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRole] = useState("all");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        adminApi.getReviews({
          search: searchQuery || undefined,
          rating: filterRating === "all" ? undefined : parseInt(filterRating),
        }),
        adminApi.getStats()
      ]);

      if (reviewsRes.data && (reviewsRes.data as any).success) {
        setReviews((reviewsRes.data as any).data || []);
      }
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDeleteClick = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReview) return;
    try {
      const { data: res } = await adminApi.deleteReview(selectedReview.id);
      if (res && (res as any).success) {
        setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id));
        setIsDeleteOpen(false);
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to delete review");
    }
  };

  const handleToggleVerify = async (review: Review) => {
    try {
      const { data: res } = await adminApi.toggleReviewVerification(review.id);
      if (res && (res as any).success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, isVerified: !r.isVerified } : r
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle review verification:", err);
      alert("Failed to update verification status");
    }
  };

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Reviews Management</h1>
          <p className="text-gray-400 mt-1">บริหารจัดการความคิดเห็นและคะแนนรีวิวจากลูกค้า</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Reviews", value: stats?.reviews?.total || 0, icon: MessageSquare, color: "text-white", bg: "bg-white/5" },
          { label: "Verified Reviews", value: stats?.reviews?.verified || 0, icon: CheckCircle2, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Average Rating", value: stats?.reviews?.avgRating || 0, icon: Star, color: "text-red-400", bg: "bg-red-500/5" },
          { label: "Products Reviewed", value: new Set(reviews.map(r => r.productId)).size, icon: Package, color: "text-red-800", bg: "bg-red-900/20" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 transition-all duration-500 shadow-inner", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black text-white tracking-tighter mb-1">{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder="ค้นหาในเนื้อหารีวิว..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {["all", "5", "4", "3", "2", "1"].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRole(rating)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest flex items-center gap-2",
                  filterRating === rating 
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                {rating === "all" ? "All Stars" : (
                  <>
                    {rating} <Star className="w-3 h-3 fill-current" />
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Reviews Table */}
      <Card className="border-white/5 bg-white/2 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading reviews...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-5 text-left border-b border-white/5">User & Product</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Rating</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Comment</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Date</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviews.map((review, index) => (
                  <motion.tr
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/2 transition-colors group"
                  >
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-red-500" />
                          <span className="font-bold text-white text-sm">{review.user.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500 font-bold uppercase">{review.product.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.max(0, 5) }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < review.rating ? "text-red-500 fill-red-500" : "text-white/10"
                            )}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm text-gray-300 font-medium max-w-md line-clamp-2">
                        {review.comment}
                      </p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase">
                          {new Date(review.createdAt).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleVerify(review)}
                          className={cn(
                            "w-10 h-10 rounded-xl transition-all",
                            review.isVerified
                              ? "text-green-500 hover:bg-green-500/10"
                              : "text-gray-500 hover:bg-white/5"
                          )}
                          title={review.isVerified ? "ยกเลิกการยืนยัน" : "ยืนยันรีวิว"}
                        >
                          {review.isVerified ? <CheckCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(review)}
                          className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && reviews.length === 0 && (
          <div className="p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
            <MessageSquare className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">No reviews found</p>
          </div>
        )}
      </Card>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="ลบรีวิว"
        message="คุณต้องการลบรีวิวนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบรีวิว"
        type="danger"
      />
    </div>
  );
}
