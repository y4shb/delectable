import { Capacitor } from '@capacitor/core';

/**
 * Returns true when the app is running inside a native Capacitor shell
 * (iOS or Android), false when running in a regular browser.
 */
export function useIsNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns the current platform: 'ios' | 'android' | 'web'.
 */
export function usePlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}
