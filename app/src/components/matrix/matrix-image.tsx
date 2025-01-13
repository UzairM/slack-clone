'use client';

import { useMatrix } from '@/hooks/use-matrix';
import { getMatrixImageUrl } from '@/lib/matrix/utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MatrixImageProps {
  mxcUrl?: string;
  fallbackUrl?: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  resizeMethod?: 'crop' | 'scale';
}

export function MatrixImage({
  mxcUrl,
  fallbackUrl,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  sizes,
  quality,
  resizeMethod = 'scale',
}: MatrixImageProps) {
  const { client } = useMatrix();

  // Convert MXC URL to HTTP URL
  const imageUrl = getMatrixImageUrl(
    client,
    mxcUrl,
    fallbackUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(alt)}`,
    width,
    height,
    resizeMethod
  );

  // Common props for both fill and fixed size images
  const commonProps = {
    src: imageUrl,
    alt,
    className: cn('transition-opacity duration-200', className),
    priority,
    quality,
  };

  // If fill is true, use fill mode
  if (fill) {
    return <Image {...commonProps} fill sizes={sizes || '100vw'} />;
  }

  // Otherwise, use fixed dimensions
  return <Image {...commonProps} width={width || 400} height={height || 400} sizes={sizes} />;
}
