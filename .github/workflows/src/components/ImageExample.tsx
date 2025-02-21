'use client';

import { OptimizedImage } from './ui/OptimizedImage';
import { useState, useEffect } from 'react';
import { validateImageUrl, getImageDimensions } from '@/lib/utils/image';

interface ImageExampleProps {
  imageUrl?: string;
}

export const ImageExample: React.FC<ImageExampleProps> = ({
  imageUrl = 'https://images.unsplash.com/photo-1682687982501-1e58ab814714'
}) => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateImage = async () => {
      try {
        const [valid, imageDimensions] = await Promise.all([
          validateImageUrl(imageUrl),
          getImageDimensions(imageUrl)
        ]);

        setIsValid(valid);
        setDimensions(imageDimensions);
      } catch (error) {
        console.error('Error validating image:', error);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateImage();
  }, [imageUrl]);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  if (!isValid) {
    return (
      <div className="w-full h-64 bg-red-100 flex items-center justify-center rounded-lg">
        <span className="text-red-500">Invalid image URL</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <OptimizedImage
        src={imageUrl}
        alt="Example image"
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-lg"
        priority={true}
        quality={90}
        objectFit="cover"
      />
    </div>
  );
}; 