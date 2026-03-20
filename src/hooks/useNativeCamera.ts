import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

interface PhotoResult {
  /** Base64-encoded image data or a web object URL */
  dataUrl: string;
  /** MIME type of the captured image */
  format: string;
}

/**
 * Provides camera access that works on both native (Capacitor) and web.
 *
 * On native platforms the Capacitor Camera plugin is used.
 * On web it falls back to an HTML file input picker.
 */
export function useNativeCamera() {
  const isNative = Capacitor.isNativePlatform();

  /**
   * Opens the device camera to take a photo.
   * On web, opens a file picker restricted to the camera.
   */
  const takePhoto = useCallback(async (): Promise<PhotoResult | null> => {
    if (isNative) {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          width: 1200,
          height: 1200,
        });
        return {
          dataUrl: image.dataUrl ?? '',
          format: `image/${image.format}`,
        };
      } catch {
        // User cancelled or permission denied
        return null;
      }
    }

    // Web fallback: create a temporary file input with capture attribute
    return new Promise<PhotoResult | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            format: file.type,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      // Handle cancel (input never fires change)
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  }, [isNative]);

  /**
   * Opens the device gallery / photo library to pick an existing photo.
   * On web, opens a standard file picker.
   */
  const pickFromGallery = useCallback(async (): Promise<PhotoResult | null> => {
    if (isNative) {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
          width: 1200,
          height: 1200,
        });
        return {
          dataUrl: image.dataUrl ?? '',
          format: `image/${image.format}`,
        };
      } catch {
        return null;
      }
    }

    // Web fallback: file picker without capture attribute
    return new Promise<PhotoResult | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            format: file.type,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  }, [isNative]);

  return { takePhoto, pickFromGallery };
}
