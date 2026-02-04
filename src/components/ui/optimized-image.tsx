import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  priority?: boolean;
  index?: number;
}

const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";

export function OptimizedImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className = "object-cover",
  containerClassName = "relative w-full h-full",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  index = 0,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`${containerClassName} flex flex-col items-center justify-center bg-white/5`}>
        <ImageOff className="w-8 h-8 text-gray-600 mb-1" />
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">No Image</span>
      </div>
    );
  }

  const isPriority = priority || index < 3;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={isPriority}
        placeholder="blur"
        blurDataURL={blurDataURL}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={isPriority}
      placeholder="blur"
      blurDataURL={blurDataURL}
      onError={() => setError(true)}
    />
  );
}

// Helper to get image source from product
export function getProductImageSource(product: {
  thumbnail?: string | null;
  images?: string[] | null;
}): string | null {
  return product.thumbnail || product.images?.[0] || null;
}
