import { Capacitor } from '@capacitor/core';

/**
 * Initializes Capacitor native plugins when running inside a native shell.
 * Safe to call on web -- all plugin imports are guarded by platform checks.
 *
 * Call this once from _app.tsx inside a useEffect.
 */
export async function initCapacitorPlugins(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // --- StatusBar ---
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');

    // Check current system color scheme and set status bar accordingly
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    await StatusBar.setStyle({
      style: prefersDark ? Style.Light : Style.Dark,
    });

    // Listen for color scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
      await StatusBar.setStyle({
        style: e.matches ? Style.Light : Style.Dark,
      });
    });
  } catch {
    // StatusBar plugin not available
  }

  // --- SplashScreen ---
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    // Hide the splash screen once the app is ready
    await SplashScreen.hide();
  } catch {
    // SplashScreen plugin not available
  }

  // --- Keyboard ---
  try {
    const { Keyboard } = await import('@capacitor/keyboard');

    Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${info.keyboardHeight}px`,
      );
      document.body.classList.add('keyboard-visible');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      document.body.classList.remove('keyboard-visible');
    });
  } catch {
    // Keyboard plugin not available
  }
}
