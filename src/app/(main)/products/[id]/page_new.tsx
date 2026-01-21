import { type Metadata, ResolvingMetadata } from 'next';
import { productsApi } from '@/lib/api';
import { ProductDetail } from './ProductDetail';
import type { Product } from '@/types';

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
    const product = (data as any)?.data;

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
    initialProduct = (data as any)?.data;
  } catch (error) {
    console.error('Failed to fetch initial product for SSR:', error);
  }

  return <ProductDetail initialProduct={initialProduct} />;
}
