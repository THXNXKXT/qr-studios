import { useState, useEffect } from 'react';
import { productsApi } from '@/lib/api';
import type { ProductCategory } from '@/types';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  images: string[];
  features: string[];
  tags: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: string;
  downloadKey?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useProducts(params?: {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ProductsResponse['pagination']>();

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await productsApi.getAll(params);

      if (apiError) {
        setError(apiError);
        setLoading(false);
        return;
      }

      if (data && typeof data === 'object' && 'data' in data) {
        setProducts((data as ProductsResponse).data || []);
        setPagination((data as ProductsResponse).pagination);
      }

      setLoading(false);
    }

    fetchProducts();
  }, [params?.category, params?.search, params?.sort, params?.page, params?.limit]);

  return { products, loading, error, pagination };
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeatured() {
      setLoading(true);
      const { data, error: apiError } = await productsApi.getAll({ limit: 6 });

      if (apiError) {
        setError(apiError);
      } else if (data && typeof data === 'object' && 'data' in data) {
        setProducts(((data as ProductsResponse).data || []).filter((p: Product) => p.isFeatured));
      }

      setLoading(false);
    }

    fetchFeatured();
  }, []);

  return { products, loading, error };
}

export function useFlashSaleProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlashSale() {
      setLoading(true);
      const { data, error: apiError } = await productsApi.getAll();

      if (apiError) {
        setError(apiError);
      } else if (data && typeof data === 'object' && 'data' in data) {
        setProducts(((data as ProductsResponse).data || []).filter((p: Product) => p.isFlashSale));
      }

      setLoading(false);
    }

    fetchFlashSale();
  }, []);

  return { products, loading, error };
}
