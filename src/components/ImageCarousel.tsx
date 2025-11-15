'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';

interface ImageCarouselProps {
  images?: string[];
}

// Configuration parameters
const SENSITIVITY = 200;
const SPREAD = 120;
const MAX_OFFSET = 2;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1;
const SCALE_SPREAD = 0.5;

export default function ImageCarousel({ images }: ImageCarouselProps) {
  // Use provided images or default placeholders
  const defaultImages = Array.from({ length: 7 }, () => `/placeholder.png`);
  const imageList = images || defaultImages;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  const totalImages = imageList.length;

  // Calculate the position and scale for each image based on distance from center
  const getImageStyle = (index: number) => {
    // Offset calculations
    const indexOffset = index - currentIndex;
    const dragOffset = (currentX - startX) / SENSITIVITY;
    const offset = (indexOffset + dragOffset + totalImages) % totalImages
    const adjustedOffset = offset > totalImages / 2 ? offset - totalImages : offset;
    const absOffset = Math.abs(adjustedOffset);
    
    // Scale calculation: largest at center, smaller as distance increases
    const scale = gaussian(adjustedOffset, MIN_SCALE, MAX_SCALE, SCALE_SPREAD);
    const x = adjustedOffset * SPREAD;
    const zIndex = Math.max(0, 100 - Math.floor(absOffset * 10));
    const opacity = Math.max(0, 1 - (absOffset - 1) / MAX_OFFSET)
    
    return {
      transform: `translate3d(${x}px, 0, 0) scale(${scale})`,
      zIndex,
      opacity
    };
  };

  const offsetImage = useCallback((offset: number) => {
    setCurrentIndex((prevIndex) => (prevIndex + offset + totalImages) % totalImages)
  }, [totalImages])

  // Mouse/Touch drag handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(clientX);
  };

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    const offset = -Math.round((currentX - startX) / SENSITIVITY);

    offsetImage(offset)
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  }, [isDragging, currentX, startX, offsetImage]);

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
        onClick={() => offsetImage(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Previous image"
        disabled={isDragging}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      <button
        onClick={() => offsetImage(1)}
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

function gaussian(x: number, min: number, max: number, spread: number) {
  const exp = -x*x/(2*spread);
  return (max - min) * Math.exp(exp) + min;
}