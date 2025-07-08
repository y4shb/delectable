import { Box } from '@mui/material';
import { useState } from 'react';

interface PhotoCarouselProps {
  images: string[];
}

export default function PhotoCarousel({ images }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  if (!images.length) return null;
  return (
    <Box sx={{ position: 'relative', width: '100%', height: 220, borderRadius: 3, overflow: 'hidden', mb: 2 }}>
      <img
        src={images[index]}
        alt={`carousel-img-${index}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
      />
      {images.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
          {images.map((_, i) => (
            <Box
              key={i}
              onClick={() => setIndex(i)}
              sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i === index ? 'primary.main' : 'grey.400', cursor: 'pointer' }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
