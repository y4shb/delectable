import { useState, useRef, useCallback, type DragEvent } from 'react';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  useTheme,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadImage } from '../api/upload';

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageUploadProps {
  /** Current image URL (for pre-populated state). */
  value?: string;
  /** Called with the final uploaded image URL. */
  onChange: (url: string) => void;
  /** S3 folder/prefix for the upload (default: "uploads"). */
  folder?: string;
  /** Aspect ratio for the preview container (default: 16/9). */
  aspectRatio?: number;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  aspectRatio = 16 / 9,
}: ImageUploadProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.has(file.type)) {
      return 'Invalid file type. Accepted: JPEG, PNG, WebP, HEIC.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10MB.';
    }
    return null;
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      try {
        const url = await uploadImage(file, folder, (pct) => {
          setProgress(pct);
        });
        // Replace local preview with the final S3 URL
        URL.revokeObjectURL(localPreview);
        setPreview(url);
        onChange(url);
      } catch {
        URL.revokeObjectURL(localPreview);
        setPreview(value || null);
        setError('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange, validateFile, value],
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so re-selecting the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    if (preview && !preview.startsWith('http')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setProgress(0);
    setError(null);
    onChange('');
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <Box>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-label="Upload image"
      />

      {preview ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: `${(1 / aspectRatio) * 100}%`,
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src={preview}
            alt="Upload preview"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {uploading && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                px: 2,
                py: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
              }}
            >
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#fff',
                    borderRadius: 3,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: '#fff', mt: 0.5, display: 'block', textAlign: 'center' }}
              >
                Uploading {progress}%
              </Typography>
            </Box>
          )}
          {!uploading && (
            <IconButton
              onClick={handleRemove}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
              size="small"
              aria-label="Remove image"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ) : (
        <Box
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            width: '100%',
            paddingTop: `${(1 / aspectRatio) * 100}%`,
            position: 'relative',
            borderRadius: '20px',
            border: '2px dashed',
            borderColor: dragOver
              ? theme.palette.primary.main
              : 'text.secondary',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            bgcolor: dragOver
              ? isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)'
              : 'transparent',
            '&:hover': {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.04)',
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            {dragOver ? (
              <CloudUploadIcon
                sx={{ color: theme.palette.primary.main, fontSize: 40 }}
              />
            ) : (
              <PhotoCameraIcon
                sx={{ color: 'text.secondary', fontSize: 40 }}
              />
            )}
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {dragOver ? 'Drop image here' : 'Click or drag to upload'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              JPEG, PNG, WebP, HEIC (max 10MB)
            </Typography>
          </Box>
        </Box>
      )}

      {error && (
        <Typography
          color="error"
          variant="caption"
          sx={{ mt: 1, display: 'block' }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}
