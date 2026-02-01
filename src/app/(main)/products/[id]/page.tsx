import { type Metadata, ResolvingMetadata } from 'next';
import { productsApi } from '@/lib/api';
import { ProductDetail } from './ProductDetail';
import type { Product } from '@/types';
import { createLogger } from '@/lib/logger';

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
}

const productDetailLogger = createLogger('product:detail');

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  try {
    const { data } = await productsApi.getById(id);
    const response = data as ApiResponse<Product>;
    const product = response?.data;

    if (!product) {
      return {
        title: 'Product Not Found | QR Studios',
      };
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
      title: `${product.name} | QR Studios`,
      description: product.description,
      openGraph: {
        title: product.name,
        description: product.description,
        images: product.thumbnail ? [product.thumbnail, ...previousImages] : previousImages,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description,
        images: product.thumbnail ? [product.thumbnail] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Product Details | QR Studios',
    };
  }
}

export default async function Page({ params }: Props) {
  const id = (await params).id;
  let initialProduct: Product | undefined;

  try {
    const { data } = await productsApi.getById(id);
    const response = data as ApiResponse<Product>;
    initialProduct = response?.data;
  } catch (error) {
    productDetailLogger.error('Failed to fetch initial product for SSR', { error });
  }

  return <ProductDetail initialProduct={initialProduct} />;
}
