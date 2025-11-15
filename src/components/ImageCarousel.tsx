'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';

interface ImageCarouselProps {
  images?: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  // Use provided images or default placeholders
  const defaultImages = Array.from({ length: 7 }, () => `/placeholder.png`);
  const imageList = images || defaultImages;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const totalImages = imageList.length;

  // Calculate the position and scale for each image based on distance from center
  const getImageStyle = (index: number) => {
    const offset = (index - currentIndex + totalImages) % totalImages;
    const adjustedOffset = offset > totalImages / 2 ? offset - totalImages : offset;
    
    // Add drag offset for smooth dragging
    const finalOffset = adjustedOffset + dragOffset / 100;
    
    const absOffset = Math.abs(finalOffset);
    
    // Scale calculation: largest at center, smaller as distance increases
    let scale: number;
    if (absOffset === 0) {
      scale = 1; // Center image
    } else if (absOffset <= 1) {
      scale = 1 - absOffset * 0.3; // Adjacent images
    } else if (absOffset <= 2) {
      scale = 0.7 - (absOffset - 1) * 0.2; // Further images
    } else {
      scale = 0.5 - (absOffset - 2) * 0.1; // Distant images
    }
    
    // Position calculation: spread images in a circular arc
    const angle = finalOffset * 45; // 30 degrees between each image
    const radius = 200;
    const x = Math.sin((angle * Math.PI) / 180) * radius;
    const z = -Math.cos((angle * Math.PI) / 180) * radius + radius;
    
    // Z-index: center image has highest, decreasing with distance
    const zIndex = Math.max(0, 100 - Math.floor(absOffset * 10));
    
    // Opacity: fade out distant images
    const opacity = absOffset > 3 ? 0 : 1 - Math.max(0, absOffset - 1) * 0.3;
    
    return {
      transform: `translate3d(${x}px, 0, ${z}px) scale(${scale})`,
      zIndex,
      opacity,
    };
  };

  const nextImage = useCallback(() => {
    if (!isDragging) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalImages);
    }
  }, [totalImages, isDragging]);

  const prevImage = useCallback(() => {
    if (!isDragging) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages);
    }
  }, [totalImages, isDragging]);

  // Mouse/Touch drag handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(clientX);
  };

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    
    setCurrentX(clientX);
    const diff = clientX - startX;
    setDragOffset(diff * 0.5); // Reduce sensitivity
  }, [isDragging, startX]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    const threshold = 50; // Minimum drag distance to trigger navigation
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
    setStartX(0);
    setCurrentX(0);
  }, [isDragging, currentX, startX, nextImage, prevImage]);

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX)
      };

      const handleGlobalMouseUp = () => {
        handleEnd();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="relative w-full h-96 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 rounded-lg select-none">
      {/* Navigation Arrows */}
      <button
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Previous image"
        disabled={isDragging}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Next image"
        disabled={isDragging}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Carousel Container */}
      <div
        className="relative w-full h-full flex items-center justify-center cursor-grab"
        style={{ 
          perspective: '1000px',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        {imageList.map((src, index) => {
          const style = getImageStyle(index);
          return (
            <div
              key={index}
              className={`absolute ease-out cursor-pointer ${isDragging ? 'transition-none' : 'transition-all duration-500'}`}
              style={{
                ...style,
                transformStyle: 'preserve-3d',
              }}
              onClick={(e) => {
                e.preventDefault();
                if (index !== currentIndex && !isDragging) {
                  setCurrentIndex(index);
                }
              }}
            >
              <Image
                src={src}
                width={200}
                height={200}
                alt={`Carousel image ${index + 1}`}
                className="rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 pointer-events-none"
                style={{
                  width: '200px',
                  height: '200px',
                  objectFit: 'cover',
                }}
                draggable={false}
              />
            </div>
          );
        })}
      </div>
      
      {/* Image Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm pointer-events-none">
        {currentIndex + 1} / {totalImages}
      </div>
    </div>
  );
}