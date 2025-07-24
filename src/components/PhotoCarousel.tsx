import { Box } from '@mui/material';
import { useState } from 'react';

interface PhotoCarouselProps {
  images: string[];
}

export default function PhotoCarousel({ images }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  if (!images.length) return null;
  return (
    <Box 
      id="photo-carousel"
      role="region" 
      aria-label="Image carousel"
      aria-roledescription="carousel"
      aria-live="polite"
      sx={{ position: 'relative', width: '100%', height: 220, borderRadius: 3, overflow: 'hidden', mb: 2 }}
    >
      <div 
        role="group" 
        aria-roledescription="slide"
        aria-label={`Slide ${index + 1} of ${images.length}`}
      >
        <img
          src={images[index]}
          alt={`${images.length > 1 ? 'Carousel image ' + (index + 1) + ' of ' + images.length + ': ' : ''}${'Image content'}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
        />
      </div>
      {images.length > 1 && (
        <Box 
          role="tablist"
          aria-label="Slide controls"
          sx={{ 
            position: 'absolute', 
            bottom: 8, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'flex', 
            gap: 1 
          }}
        >
          {images.map((_, i) => (
            <Box
              key={i}
              id={`carousel-indicator-${i}`}
              role="tab"
              aria-label={`Slide ${i + 1}`}
              aria-selected={i === index}
              aria-controls={`carousel-slide-${i}`}
              tabIndex={0}
              onClick={() => setIndex(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIndex(i);
                }
              }}
              sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: i === index ? 'primary.main' : 'grey.400', 
                cursor: 'pointer',
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
