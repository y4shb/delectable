import '../../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline, Typography, Button, Box } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ColorModeContext } from '../theme/ColorModeContext';
import { getTheme } from '../theme/theme';
import { CacheProvider, EmotionCache } from '@emotion/react';
import createEmotionCache from '../createEmotionCache';
import { AuthProvider } from '../context/AuthContext';
import { UserPreferencesProvider } from '../context/UserPreferencesContext';
import { NotificationBadgeProvider } from '../components/NotificationBadgeProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';

const STORAGE_KEY = 'delectable_color_mode';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Classy Pen", Helvetica, sans-serif',
              fontSize: 48,
              color: '#F24D4F',
              mb: 1,
            }}
          >
            de.
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
            An unexpected error occurred. Please try refreshing the page.
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleReset}
            sx={{
              bgcolor: '#F24D4F',
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
              '&:hover': { bgcolor: '#d93d3f' },
            }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const clientSideEmotionCache = createEmotionCache();

export default function MyApp({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) {
  const router = useRouter();
  // Start with 'light' during SSR to avoid hydration mismatches
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Hydrate mode from localStorage or system preference after mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      setMode(stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Persist mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Add smooth transition on body for background-color and color changes
  useEffect(() => {
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, []);

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

  const toggleColorMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ErrorBoundary>
      <CacheProvider value={emotionCache}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UserPreferencesProvider>
              <NotificationBadgeProvider>
                <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
                  <ThemeProvider theme={muiTheme}>
                    <CssBaseline />
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={router.asPath}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <Component {...pageProps} />
                      </motion.div>
                    </AnimatePresence>
                  </ThemeProvider>
                </ColorModeContext.Provider>
              </NotificationBadgeProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </CacheProvider>
    </ErrorBoundary>
  );
}
