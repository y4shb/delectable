import '../../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ColorModeContext } from '../theme/ColorModeContext';
import { getTheme } from '../theme/theme';
import { CacheProvider, EmotionCache } from '@emotion/react';
import createEmotionCache from '../createEmotionCache';
import { AuthProvider } from '../context/AuthContext';
import { UserPreferencesProvider } from '../context/UserPreferencesContext';

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const clientSideEmotionCache = createEmotionCache();

export default function MyApp({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const muiTheme = useMemo(() => getTheme(mode), [mode]);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  // Removed system theme detection - app now defaults to light mode
  // useEffect(() => {
  //   const mq = window.matchMedia('(prefers-color-scheme: dark)');
  //   setMode(mq.matches ? 'dark' : 'light');
  //   const handler = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
  //   mq.addEventListener('change', handler);
  //   return () => mq.removeEventListener('change', handler);
  // }, []);

  const toggleColorMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserPreferencesProvider>
            <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
              <ThemeProvider theme={muiTheme}>
                <CssBaseline />
                <Component {...pageProps} />
              </ThemeProvider>
            </ColorModeContext.Provider>
          </UserPreferencesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
}
