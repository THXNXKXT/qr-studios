import { useProducts, type Product as HookProduct } from "@/hooks/useProducts";
import { ProductCard } from "@/components/product";
import { Loader2 } from "lucide-react";
import type { Product } from "@/types";

interface ProductListProps {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function ProductList({ category, search, sort, page = 1, limit = 12 }: ProductListProps) {
  const { products, loading, error, pagination } = useProducts({
    category,
    search,
    sort,
    page,
    limit,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">ไม่พบสินค้า</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as any as Product} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          {Array.from({ length: Math.max(0, pagination.totalPages) }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              className={`px-4 py-2 rounded-lg transition-all ${
                pageNum === pagination.page
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
